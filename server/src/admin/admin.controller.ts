import { Controller, Post } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';

@Controller('admin')
export class AdminController {
  private client = getSupabaseClient();

  @Post('clean-photo-urls')
  async cleanPhotoUrls() {
    const { data: photos, error } = await this.client
      .from('photos')
      .select('*');

    if (error) {
      return { code: 500, msg: '查询照片失败', error };
    }

    let cleanedCount = 0;

    for (const photo of photos || []) {
      const urlValue = photo.url;

      if (typeof urlValue === 'string' && urlValue.startsWith('{')) {
        try {
          const parsed = JSON.parse(urlValue);
          const realUrl = parsed.url;

          if (realUrl) {
            const { error: updateError } = await this.client
              .from('photos')
              .update({ url: realUrl })
              .eq('id', photo.id);

            if (!updateError) {
              cleanedCount++;
            }
          }
        } catch (e) {
          console.error(`处理照片 ${photo.id} 时出错:`, e);
        }
      }
    }

    return {
      code: 200,
      msg: '清理完成',
      data: { total: photos?.length || 0, cleaned: cleanedCount }
    };
  }
}
