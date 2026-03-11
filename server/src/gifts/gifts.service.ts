import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertGift } from '../storage/database/shared/schema';

@Injectable()
export class GiftsService {
  private client = getSupabaseClient();

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
