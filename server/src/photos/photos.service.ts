import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { photos } from '../storage/database/shared/schema';
import { InsertPhoto } from '../storage/database/shared/schema';

@Injectable()
export class PhotosService {
  async findByMemorialId(memorialId: string) {
    return db.select().from(photos)
      .where(eq(photos.memorialId, memorialId))
      .orderBy(photos.orderIndex);
  }

  async create(createPhotoDto: InsertPhoto) {
    const row = await db.insert(photos).values({
      memorialId: createPhotoDto.memorialId!,
      url: createPhotoDto.url!,
      ...(createPhotoDto.orderIndex !== undefined ? { orderIndex: createPhotoDto.orderIndex } : {}),
    }).returning();
    return row[0];
  }

  async createBatch(memorialId: string, urls: string[]) {
    const rows = urls.map((url, index) => ({
      memorialId,
      url,
      orderIndex: index,
    }));
    return db.insert(photos).values(rows).returning();
  }

  async remove(id: string) {
    await db.delete(photos).where(eq(photos.id, id));
    return { id };
  }

  async removeByMemorialId(memorialId: string) {
    await db.delete(photos).where(eq(photos.memorialId, memorialId));
    return { memorialId };
  }
}