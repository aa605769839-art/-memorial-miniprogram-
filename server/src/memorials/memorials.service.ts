import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';

@Injectable()
export class MemorialsService {
  private client = getSupabaseClient();

  async findAll(userId?: string) {
    let query = this.client
      .from('memorials')
      .select('*')
      .order('created_at', { ascending: false });

    // 如果提供了 userId，只返回该用户的故友
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.client
      .from('memorials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findPhotos(memorialId: string) {
    const { data, error } = await this.client
      .from('photos')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findOneWithPhotos(id: string) {
    const memorial = await this.findOne(id);
    const photos = await this.findPhotos(id);
    return {
      ...memorial,
      photos
    };
  }

  async findComments(memorialId: string) {
    const { data, error } = await this.client
      .from('comments')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async create(createMemorialDto: InsertMemorial) {
    // 转换 camelCase 为 snake_case，因为 Supabase SDK 使用数据库字段名
    const dbData: Record<string, any> = {};
    if (createMemorialDto.userId) dbData.user_id = createMemorialDto.userId;
    if (createMemorialDto.name) dbData.name = createMemorialDto.name;
    if (createMemorialDto.gender !== undefined) dbData.gender = createMemorialDto.gender;
    if (createMemorialDto.birthDate) dbData.birth_date = createMemorialDto.birthDate;
    if (createMemorialDto.deathDate) dbData.death_date = createMemorialDto.deathDate;
    if (createMemorialDto.avatarUrl) dbData.avatar_url = createMemorialDto.avatarUrl;
    if (createMemorialDto.description) dbData.description = createMemorialDto.description;
    if (createMemorialDto.achievements) dbData.achievements = createMemorialDto.achievements;

    const { data, error } = await this.client
      .from('memorials')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateMemorialDto: UpdateMemorial) {
    // 转换 camelCase 为 snake_case
    const dbData: Record<string, any> = {};
    if (updateMemorialDto.name !== undefined) dbData.name = updateMemorialDto.name;
    if (updateMemorialDto.gender !== undefined) dbData.gender = updateMemorialDto.gender;
    if (updateMemorialDto.birthDate !== undefined) dbData.birth_date = updateMemorialDto.birthDate;
    if (updateMemorialDto.deathDate !== undefined) dbData.death_date = updateMemorialDto.deathDate;
    if (updateMemorialDto.avatarUrl !== undefined) dbData.avatar_url = updateMemorialDto.avatarUrl;
    if (updateMemorialDto.description !== undefined) dbData.description = updateMemorialDto.description;
    if (updateMemorialDto.achievements !== undefined) dbData.achievements = updateMemorialDto.achievements;

    const { data, error } = await this.client
      .from('memorials')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client
      .from('memorials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { id };
  }
}
