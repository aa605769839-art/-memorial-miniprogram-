import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertPhoto } from '../storage/database/shared/schema';

@Injectable()
export class PhotosService {
  private client = getSupabaseClient();

  async findByMemorialId(memorialId: string) {
    const { data, error } = await this.client
      .from('photos')
      .select('*')
      .eq('memorial_id', memorialId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  async create(createPhotoDto: InsertPhoto) {
    const dbData: Record<string, any> = {};
    if (createPhotoDto.memorialId) dbData.memorial_id = createPhotoDto.memorialId;
    if (createPhotoDto.url) dbData.url = createPhotoDto.url;
    if (createPhotoDto.orderIndex !== undefined) dbData.order_index = createPhotoDto.orderIndex;

    const { data, error } = await this.client
      .from('photos')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createBatch(memorialId: string, urls: string[]) {
    const photos = urls.map((url, index) => ({
      memorial_id: memorialId,
      url,
      order_index: index
    }));

    const { data, error } = await this.client
      .from('photos')
      .insert(photos)
      .select();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client
      .from('photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { id };
  }

  async removeByMemorialId(memorialId: string) {
    const { error } = await this.client
      .from('photos')
      .delete()
      .eq('memorial_id', memorialId);

    if (error) throw error;
    return { memorialId };
  }
}
