import { Controller, Post } from '@nestjs/common';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { Pool } from 'pg';

@Controller('admin')
export class AdminController {
  private client = getSupabaseClient();

  @Post('add-gender-column')
  async addGenderColumn() {
    try {
      // 使用 PostgreSQL 直接连接执行 SQL
      const pool = new Pool({
        connectionString: process.env.COZE_SUPABASE_URL?.replace('supabase://', 'postgresql://'),
      });

      const client = await pool.connect();
      try {
        // 检查列是否已存在
        const checkResult = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'memorials' AND column_name = 'gender'
        `);

        if (checkResult.rows.length === 0) {
          // 列不存在，添加列
          await client.query('ALTER TABLE memorials ADD COLUMN gender VARCHAR(10)');
          return {
            code: 200,
            msg: 'gender 字段添加成功'
          };
        } else {
          return {
            code: 200,
            msg: 'gender 字段已存在'
          };
        }
      } finally {
        client.release();
        await pool.end();
      }
    } catch (e) {
      console.error('迁移失败:', e);
      return {
        code: 500,
        msg: '迁移失败，请手动在数据库中执行：ALTER TABLE memorials ADD COLUMN IF NOT EXISTS gender VARCHAR(10)',
        error: e.message
      };
    }
  }

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
