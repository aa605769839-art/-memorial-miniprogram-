import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertGiftConfig, UpdateGiftConfig } from '../storage/database/shared/schema';

@Injectable()
export class GiftConfigsService {
  private client = getSupabaseClient();

  async findAll() {
    const { data, error } = await this.client
      .from('gift_configs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findEnabled() {
    const { data, error } = await this.client
      .from('gift_configs')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.client
      .from('gift_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createGiftConfigDto: InsertGiftConfig) {
    const dbData: Record<string, any> = {
      name: createGiftConfigDto.name,
      icon: createGiftConfigDto.icon,
      color: createGiftConfigDto.color,
      price: createGiftConfigDto.price ?? 0,
      sort_order: createGiftConfigDto.sortOrder ?? 0,
      is_enabled: createGiftConfigDto.isEnabled ?? true,
    };

    const { data, error } = await this.client
      .from('gift_configs')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateGiftConfigDto: UpdateGiftConfig) {
    const dbData: Record<string, any> = {};
    if (updateGiftConfigDto.name !== undefined) dbData.name = updateGiftConfigDto.name;
    if (updateGiftConfigDto.icon !== undefined) dbData.icon = updateGiftConfigDto.icon;
    if (updateGiftConfigDto.color !== undefined) dbData.color = updateGiftConfigDto.color;
    if (updateGiftConfigDto.price !== undefined) dbData.price = updateGiftConfigDto.price;
    if (updateGiftConfigDto.sortOrder !== undefined) dbData.sort_order = updateGiftConfigDto.sortOrder;
    if (updateGiftConfigDto.isEnabled !== undefined) dbData.is_enabled = updateGiftConfigDto.isEnabled;

    const { data, error } = await this.client
      .from('gift_configs')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSort(id: string, sortOrder: number) {
    const { data, error } = await this.client
      .from('gift_configs')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client
      .from('gift_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { id };
  }
}
