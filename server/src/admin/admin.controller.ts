import { Controller, Post } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { photos } from '../storage/database/shared/schema';

@Controller('admin')
export class AdminController {
  @Post('clean-photo-urls')
  async cleanPhotoUrls() {
    const photoRows = await db.select().from(photos);
    let cleanedCount = 0;

    for (const photo of photoRows) {
      const urlValue = photo.url;

      if (typeof urlValue === 'string' && urlValue.startsWith('{')) {
        try {
          const parsed = JSON.parse(urlValue);
          const realUrl = parsed.url;

          if (realUrl) {
            await db.update(photos)
              .set({ url: realUrl })
              .where(eq(photos.id, photo.id));
            cleanedCount++;
          }
        } catch (e) {
          console.error(`处理照片 ${photo.id} 时出错:`, e);
        }
      }
    }

    return {
      code: 200,
      msg: '清理完成',
      data: { total: photoRows.length, cleaned: cleanedCount }
    };
  }
}