import { Injectable } from '@nestjs/common';
import { eq, desc, and, gte } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorials, photos, comments } from '../storage/database/shared/schema';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';
import { AvatarService } from './avatar.service';

export interface AvatarCandidate {
  id: string;
  name?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  description?: string | null;
  achievements?: string[] | string | null;
  avatarUrl: string | null;
}

@Injectable()
export class MemorialsService {
  constructor(private readonly avatarService: AvatarService) {}

  /** 判断头像是否有效 */
  private isAvatarValid(url?: string | null): boolean {
    return AvatarService.isValidAvatar(url);
  }

  /** 更新故人头像（不回传自增字段） */
  private async updateAvatar(memorialId: string, avatarUrl: string) {
    await db.update(memorials)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(memorials.id, memorialId));
  }

  /** 异步为缺失/脏头像的故人补生成并回写 */
  private async backfillAvatarAsync(m: AvatarCandidate) {
    try {
      if (this.isAvatarValid(m.avatarUrl)) return;
      const url = await this.avatarService.generate(m);
      if (url && url !== m.avatarUrl) {
        await this.updateAvatar(m.id, url);
      }
    } catch (error) {
      console.error('backfillAvatarAsync 失败 id=' + m.id, error);
    }
  }

  /** 同步生成并回写（可用于详情页），失败保留原值 */
  private async ensureAvatarSync(m: AvatarCandidate): Promise<string | null> {
    if (this.isAvatarValid(m.avatarUrl)) return m.avatarUrl;
    const url = await this.avatarService.generate(m);
    if (url && url !== m.avatarUrl) {
      await this.updateAvatar(m.id, url).catch(() => {});
    }
    return url || m.avatarUrl;
  }

  async findAll(userId?: string) {
    let query = db.select().from(memorials);

    if (userId) {
      const rows = await query.where(eq(memorials.userId, userId)).orderBy(desc(memorials.createdAt));
      // 对缺失头像的故人做异步补全（不阻塞列表返回）
      rows.forEach((r) => {
        if (!this.isAvatarValid(r.avatarUrl)) {
          this.backfillAvatarAsync(r as unknown as AvatarCandidate).catch(() => {});
        }
      });
      return rows;
    }
    return query.orderBy(desc(memorials.createdAt));
  }

  async findOne(id: string) {
    const [row] = await db.select().from(memorials).where(eq(memorials.id, id)).limit(1);
    return row ?? null;
  }

  async findPhotos(memorialId: string) {
    return db.select().from(photos)
      .where(eq(photos.memorialId, memorialId))
      .orderBy(photos.orderIndex);
  }

  async findOneWithPhotos(id: string) {
    const memorial = await this.findOne(id);
    // 详情页同步兜底头像
    if (memorial && !this.isAvatarValid(memorial.avatarUrl)) {
      const url = await this.ensureAvatarSync(memorial as unknown as AvatarCandidate);
      if (url && memorial.avatarUrl !== url) {
        (memorial as any).avatarUrl = url;
      }
    }
    const photoList = await this.findPhotos(id);
    return {
      ...(memorial ?? {}),
      photos: photoList
    };
  }

  async findComments(memorialId: string) {
    return db.select().from(comments)
      .where(eq(comments.memorialId, memorialId))
      .orderBy(desc(comments.createdAt));
  }

  async create(createMemorialDto: InsertMemorial) {
    const row = await db.insert(memorials).values({
      userId: createMemorialDto.userId!,
      name: createMemorialDto.name!,
      ...(createMemorialDto.gender !== undefined ? { gender: createMemorialDto.gender } : {}),
      ...(createMemorialDto.birthDate ? { birthDate: createMemorialDto.birthDate } : {}),
      ...(createMemorialDto.deathDate ? { deathDate: createMemorialDto.deathDate } : {}),
      ...(createMemorialDto.avatarUrl !== undefined ? { avatarUrl: createMemorialDto.avatarUrl } : {}),
      ...(createMemorialDto.description !== undefined ? { description: createMemorialDto.description } : {}),
      ...(createMemorialDto.achievements !== undefined ? { achievements: createMemorialDto.achievements } : {}),
    }).returning();
    return row[0];
  }

  async update(id: string, updateMemorialDto: UpdateMemorial) {
    const values: Partial<typeof memorials.$inferInsert> = {};
    if (updateMemorialDto.name !== undefined) values.name = updateMemorialDto.name;
    if (updateMemorialDto.gender !== undefined) values.gender = updateMemorialDto.gender;
    if (updateMemorialDto.birthDate !== undefined) values.birthDate = updateMemorialDto.birthDate;
    if (updateMemorialDto.deathDate !== undefined) values.deathDate = updateMemorialDto.deathDate;
    if (updateMemorialDto.avatarUrl !== undefined) values.avatarUrl = updateMemorialDto.avatarUrl;
    if (updateMemorialDto.description !== undefined) values.description = updateMemorialDto.description;
    if (updateMemorialDto.achievements !== undefined) values.achievements = updateMemorialDto.achievements;

    const [row] = await db.update(memorials)
      .set(values)
      .where(eq(memorials.id, id))
      .returning();
    return row ?? null;
  }

  async remove(id: string) {
    await db.delete(memorials).where(eq(memorials.id, id));
    return { id };
  }

  // 用于排行榜筛选（保留按计数排序，兼容原接口语义）
  async findTopByCount(column: 'mourning_count' | 'visit_count', limit = 20) {
    if (column === 'visit_count') {
      return db.select().from(memorials).orderBy(desc(memorials.visitCount)).limit(limit);
    }
    return db.select().from(memorials).orderBy(desc(memorials.mourningCount)).limit(limit);
  }
}