import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { InsertMourningRecord, InsertVisitRecord, InsertComment } from '../storage/database/shared/schema';

@Injectable()
export class InteractionsService {
  private client = getSupabaseClient();

  async createMourning(createMourningDto: InsertMourningRecord) {
    // 转换 camelCase 为 snake_case
    const dbData: Record<string, any> = {
      memorial_id: createMourningDto.memorialId,
      visitor_name: createMourningDto.visitorName,
    };
    if (createMourningDto.visitorAvatar) {
      dbData.visitor_avatar = createMourningDto.visitorAvatar;
    }
    if (createMourningDto.message) {
      dbData.message = createMourningDto.message;
    }

    // 插入悼念记录
    const { data: record, error: recordError } = await this.client
      .from('mourning_records')
      .insert(dbData)
      .select()
      .single();

    if (recordError) throw recordError;

    // 获取当前悼念次数
    const { data: memorial, error: fetchError } = await this.client
      .from('memorials')
      .select('mourning_count')
      .eq('id', createMourningDto.memorialId)
      .single();

    if (fetchError) throw fetchError;

    // 更新悼念次数
    const { error: updateError } = await this.client
      .from('memorials')
      .update({ mourning_count: (memorial.mourning_count || 0) + 1 })
      .eq('id', createMourningDto.memorialId);

    if (updateError) throw updateError;

    return record;
  }

  async createVisit(createVisitDto: InsertVisitRecord) {
    // 转换 camelCase 为 snake_case
    const dbData: Record<string, any> = {
      memorial_id: createVisitDto.memorialId,
      visitor_name: createVisitDto.visitorName,
    };
    if (createVisitDto.visitorAvatar) {
      dbData.visitor_avatar = createVisitDto.visitorAvatar;
    }

    // 插入拜访记录
    const { data: record, error: recordError } = await this.client
      .from('visit_records')
      .insert(dbData)
      .select()
      .single();

    if (recordError) throw recordError;

    // 获取当前拜访次数
    const { data: memorial, error: fetchError } = await this.client
      .from('memorials')
      .select('visit_count')
      .eq('id', createVisitDto.memorialId)
      .single();

    if (fetchError) throw fetchError;

    // 更新拜访次数
    const { error: updateError } = await this.client
      .from('memorials')
      .update({ visit_count: (memorial.visit_count || 0) + 1 })
      .eq('id', createVisitDto.memorialId);

    if (updateError) throw updateError;

    return record;
  }

  async createComment(createCommentDto: InsertComment) {
    // 转换 camelCase 为 snake_case
    const dbData: Record<string, any> = {
      memorial_id: createCommentDto.memorialId,
      author_name: createCommentDto.authorName,
      content: createCommentDto.content,
    };
    if (createCommentDto.authorAvatar) {
      dbData.author_avatar = createCommentDto.authorAvatar;
    }

    const { data, error } = await this.client
      .from('comments')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
