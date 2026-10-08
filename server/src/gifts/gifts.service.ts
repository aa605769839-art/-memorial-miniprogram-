import { Injectable } from '@nestjs/common';
import { eq, desc, count, inArray, sql } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { gifts, memorials, giftConfigs } from '../storage/database/shared/schema';
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
      price: item.price ?? 0,
      sender: {
        name: item.senderName,
        avatar: item.senderAvatar,
      },
      message: item.message,
      created_at: item.createdAt,
    }));
  }

  // 创建礼物记录（同时在故人上累计悼念值，删除礼物不回退）
  async create(insertGift: InsertGift) {
    // 根据 giftType（送礼时传的是 gift_config id）取积分
    let price = 0;
    if (insertGift.giftType) {
      const [cfg] = await db.select({ price: giftConfigs.price })
        .from(giftConfigs)
        .where(eq(giftConfigs.id, insertGift.giftType))
        .limit(1);
      price = cfg?.price ?? 0;
    }
    const row = await db.insert(gifts).values({
      memorialId: insertGift.memorialId!,
      giftType: insertGift.giftType!,
      giftName: insertGift.giftName!,
      senderName: insertGift.senderName || '访客',
      price,
      ...(insertGift.giftIcon ? { giftIcon: insertGift.giftIcon } : {}),
      ...(insertGift.senderAvatar ? { senderAvatar: insertGift.senderAvatar } : {}),
      ...(insertGift.message ? { message: insertGift.message } : {}),
    }).returning();

    // 悼念值累计（只增不减）
    if (price > 0) {
      await db.update(memorials)
        .set({ tributeValue: sql`${memorials.tributeValue} + ${price}` })
        .where(eq(memorials.id, insertGift.memorialId!))
        .catch(() => {
          /* 累计失败不阻断送礼 */
        });
    }
    return row[0];
  }
}