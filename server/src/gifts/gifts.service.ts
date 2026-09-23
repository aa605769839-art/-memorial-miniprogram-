import { Injectable } from '@nestjs/common';
import { eq, desc, count, inArray } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { gifts, memorials } from '../storage/database/shared/schema';
import { InsertGift } from '../storage/database/shared/schema';

@Injectable()
export class GiftsService {
  // 获取所有礼物记录（用于中台日志）- 关联 memorials 表获取故人信息
  async findAll(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const [totalRow] = await db.select({ c: count() }).from(gifts);
    const total = totalRow?.c ?? 0;

    const giftsData = await db.select().from(gifts)
      .orderBy(desc(gifts.createdAt))
      .limit(limit)
      .offset(offset);

    const memorialIds = [...new Set(giftsData.map(g => g.memorialId).filter(Boolean))];

    let memorialsMap: Record<string, { name: string; avatar?: string }> = {};
    if (memorialIds.length > 0) {
      const mRows = await db.select({
        id: memorials.id,
        name: memorials.name,
        avatar: memorials.avatarUrl,
      }).from(memorials).where(inArray(memorials.id, memorialIds as string[]));

      memorialsMap = mRows.reduce((acc, m) => {
        acc[m.id] = { name: m.name, avatar: m.avatar ?? undefined };
        return acc;
      }, {} as Record<string, { name: string; avatar?: string }>);
    }

    const formattedData = giftsData.map(item => ({
      id: item.id,
      gift_id: item.giftType,
      gift_name: item.giftName,
      gift_icon: item.giftIcon,
      sender: {
        id: null,
        name: item.senderName,
        avatar: item.senderAvatar,
      },
      receiver: {
        id: item.memorialId,
        name: memorialsMap[item.memorialId]?.name || '未知故人',
        avatar: memorialsMap[item.memorialId]?.avatar || null,
      },
      message: item.message,
      created_at: item.createdAt,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 查询某个纪念空间的所有礼物（详情页展示）
  async findByMemorialId(memorialId: string) {
    const data = await db.select().from(gifts)
      .where(eq(gifts.memorialId, memorialId))
      .orderBy(desc(gifts.createdAt));

    return data.map(item => ({
      id: item.id,
      gift_id: item.giftType,
      gift_name: item.giftName,
      gift_icon: item.giftIcon,
      sender: {
        name: item.senderName,
        avatar: item.senderAvatar,
      },
      message: item.message,
      created_at: item.createdAt,
    }));
  }

  // 创建礼物记录
  async create(insertGift: InsertGift) {
    const row = await db.insert(gifts).values({
      memorialId: insertGift.memorialId!,
      giftType: insertGift.giftType!,
      giftName: insertGift.giftName!,
      senderName: insertGift.senderName!,
      ...(insertGift.giftIcon ? { giftIcon: insertGift.giftIcon } : {}),
      ...(insertGift.senderAvatar ? { senderAvatar: insertGift.senderAvatar } : {}),
      ...(insertGift.message ? { message: insertGift.message } : {}),
    }).returning();
    return row[0];
  }
}