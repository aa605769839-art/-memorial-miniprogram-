import { Injectable, ForbiddenException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorialOfflinePhoto, memorials, Memorial } from '../storage/database/shared/schema';
import { MembersService } from '../memorials/members.service';

export interface CreateOfflinePhotoInput {
  memorialId: string;
  userId: string;
  nick?: string;
  worshipDate?: string | Date;
  message?: string;
  urls: string[];
  isAdmin: boolean;
}

@Injectable()
export class OfflinePhotosService {
  constructor(private readonly membersService: MembersService) {}

  /** 墓碑线下照片列表（与墓碑查看权限一致，前端已按墓碑访问控制进入） */
  async listByMemorial(memorialId: string) {
    return db
      .select()
      .from(memorialOfflinePhoto)
      .where(eq(memorialOfflinePhoto.memorialId, memorialId))
      .orderBy(sql`${memorialOfflinePhoto.createdAt} DESC`);
  }

  /** 查询墓碑信息（供权限校验与外部使用） */
  async findMemorial(memorialId: string): Promise<Memorial | undefined> {
    const [row] = await db.select().from(memorials).where(eq(memorials.id, memorialId)).limit(1);
    return row;
  }

  /**
   * 上传权限：墓碑创建者 / 家属成员 / 管理员 / 墓碑开启访客上传时任意登录用户。
   */
  private async canUpload(memorial: Memorial, userId: string, isAdmin: boolean): Promise<boolean> {
    if (isAdmin) return true;
    if (memorial.userId === userId) return true;
    const role = await this.membersService.getRole(memorial.id, userId);
    if (role !== null && role !== undefined) return true; // 任一家属角色
    if (memorial.allowVisitorOffline) return true; // 管理员已开启访客上传
    return false;
  }

  /**
   * 批量创建线下悼念照片记录。每批成功上传使墓碑悼念次数 +1。
   */
  async create(input: CreateOfflinePhotoInput) {
    const memorial = await this.findMemorial(input.memorialId);
    if (!memorial) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }
    if (memorial.isDeleted) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }

    const allowed = await this.canUpload(memorial, input.userId, input.isAdmin);
    if (!allowed) {
      throw new ForbiddenException('当前墓碑未开放访客上传，仅家属可上传线下悼念照片');
    }

    const urls = (input.urls || []).filter(Boolean).slice(0, 9);
    if (urls.length === 0) {
      throw new HttpException('请至少上传一张照片', HttpStatus.BAD_REQUEST);
    }

    // 单墓碑上限 200 张
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memorialOfflinePhoto)
      .where(eq(memorialOfflinePhoto.memorialId, input.memorialId));
    if (Number(count) + urls.length > 200) {
      throw new HttpException('该墓碑线下悼念照片已达上限（200张）', HttpStatus.BAD_REQUEST);
    }

    const rows = urls.map((url) => ({
      memorialId: input.memorialId,
      userId: input.userId,
      nick: input.nick || '',
      photoUrl: url,
      worshipDate: input.worshipDate ? new Date(input.worshipDate).toISOString() : new Date().toISOString(),
      message: input.message || null,
    }));

    const inserted = await db.insert(memorialOfflinePhoto).values(rows).returning();

    // 每批上传，祷念次数 +1
    await db
      .update(memorials)
      .set({ mourningCount: sql`${memorials.mourningCount} + 1` })
      .where(eq(memorials.id, input.memorialId));

    return inserted;
  }

  /** 设置是否允许访客上传线下悼念照片 */
  async setVisitorUpload(memorialId: string, allow: boolean) {
    await db
      .update(memorials)
      .set({ allowVisitorOffline: allow })
      .where(eq(memorials.id, memorialId));
    return { allowVisitorOffline: !!allow };
  }

  /** 删除：仅上传者本人或管理员 */
  async remove(id: string, userId: string, isAdmin: boolean) {
    const [row] = await db
      .select()
      .from(memorialOfflinePhoto)
      .where(eq(memorialOfflinePhoto.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('照片不存在');
    }
    if (!isAdmin && row.userId !== userId) {
      throw new ForbiddenException('只能删除自己上传的照片');
    }
    await db.delete(memorialOfflinePhoto).where(eq(memorialOfflinePhoto.id, id));
    return { id };
  }
}