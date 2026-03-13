import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertGift } from '../storage/database/shared/schema';

@Injectable()
export class GiftsService {
  private client = getSupabaseClient();

  // 获取所有礼物记录（用于中台日志）- 关联 memorials 表获取故人姓名
  async findAll(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    
    // 获取总数
    const { count, error: countError } = await this.client
      .from('gifts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // 获取礼物数据
    const { data: giftsData, error } = await this.client
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // 获取所有相关的 memorial_id
    const memorialIds = [...new Set(giftsData?.map(g => g.memorial_id).filter(Boolean))];
    
    // 查询 memorials 表获取故人姓名
    let memorialsMap: Record<string, string> = {};
    if (memorialIds.length > 0) {
      const { data: memorialsData } = await this.client
        .from('memorials')
        .select('id, name')
        .in('id', memorialIds);
      
      memorialsMap = (memorialsData || []).reduce((acc, m) => {
        acc[m.id] = m.name;
        return acc;
      }, {} as Record<string, string>);
    }
    
    // 合并数据
    const formattedData = giftsData?.map(item => ({
      ...item,
      memorial_name: memorialsMap[item.memorial_id] || '未知故人',
    })) || [];
    
    return {
      data: formattedData,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // 查询某个纪念空间的所有礼物
  async findByMemorialId(memorialId: string) {
    const { data, error } = await this.client
      .from('gifts')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // 创建礼物记录
  async create(insertGift: InsertGift) {
    // 转换 camelCase 为 snake_case
    const dbData: Record<string, any> = {};
    if (insertGift.memorialId) dbData.memorial_id = insertGift.memorialId;
    if (insertGift.giftType) dbData.gift_type = insertGift.giftType;
    if (insertGift.giftName) dbData.gift_name = insertGift.giftName;
    if (insertGift.giftIcon) dbData.gift_icon = insertGift.giftIcon;
    if (insertGift.senderName) dbData.sender_name = insertGift.senderName;
    if (insertGift.senderAvatar) dbData.sender_avatar = insertGift.senderAvatar;
    if (insertGift.message) dbData.message = insertGift.message;

    const { data, error } = await this.client
      .from('gifts')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
