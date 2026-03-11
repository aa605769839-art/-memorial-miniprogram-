import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';

@Injectable()
export class RankingsService {
  private client = getSupabaseClient();

  async getRankings(type: string = 'mourning') {
    const column = type === 'visit' ? 'visit_count' : 'mourning_count';

    const { data, error } = await this.client
      .from('memorials')
      .select('*')
      .order(column, { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }
}
