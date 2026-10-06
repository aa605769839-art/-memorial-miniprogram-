import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorials, mourningRecords, visitRecords, comments } from '../storage/database/shared/schema';
import { InsertMourningRecord, InsertVisitRecord, InsertComment } from '../storage/database/shared/schema';

// 敏感词白名单过滤（温和稽查，符合《MZ/T 173-2021》）
const SENSITIVE_WORDS = ['法轮功', '大法', '退团保平安', '替死', '符咒', '驱邪', '作法'];

function filterSensitive(content: string): string | null {
  const hit = SENSITIVE_WORDS.find((w) => content.includes(w));
  return hit || null;
}

@Injectable()
export class InteractionsService {
  async createMourning(createMourningDto: InsertMourningRecord) {
    const [record] = await db.insert(mourningRecords).values({
      memorialId: createMourningDto.memorialId,
      visitorName: createMourningDto.visitorName || '访客',
      ...(createMourningDto.visitorAvatar ? { visitorAvatar: createMourningDto.visitorAvatar } : {}),
      ...(createMourningDto.message ? { message: createMourningDto.message } : {}),
    }).returning();

    // 递增悼念次数
    const [current] = await db.select({ count: memorials.mourningCount })
      .from(memorials)
      .where(eq(memorials.id, createMourningDto.memorialId))
      .limit(1);

    await db.update(memorials)
      .set({ mourningCount: (current?.count ?? 0) + 1 })
      .where(eq(memorials.id, createMourningDto.memorialId));

    return record;
  }

  async createVisit(createVisitDto: InsertVisitRecord) {
    const [record] = await db.insert(visitRecords).values({
      memorialId: createVisitDto.memorialId,
      visitorName: createVisitDto.visitorName || '访客',
      ...(createVisitDto.visitorAvatar ? { visitorAvatar: createVisitDto.visitorAvatar } : {}),
    }).returning();

    const [current] = await db.select({ count: memorials.visitCount })
      .from(memorials)
      .where(eq(memorials.id, createVisitDto.memorialId))
      .limit(1);

    await db.update(memorials)
      .set({ visitCount: (current?.count ?? 0) + 1 })
      .where(eq(memorials.id, createVisitDto.memorialId));

    return record;
  }

  async createComment(createCommentDto: InsertComment) {
    // 敏感词过滤
    const sensitive = filterSensitive(createCommentDto.content || '');
    if (sensitive) {
      throw new HttpException(`留言包含敏感词「${sensitive}」，请修改后重新提交`, HttpStatus.BAD_REQUEST);
    }
    if ((createCommentDto.content || '').length > 300) {
      throw new HttpException('单条留言不能超过300字', HttpStatus.BAD_REQUEST);
    }

    // 匿名留言开关校验
    const [memorial] = await db.select({ allowAnonymousMsg: memorials.allowAnonymousMsg })
      .from(memorials)
      .where(eq(memorials.id, createCommentDto.memorialId))
      .limit(1);
    if (memorial && memorial.allowAnonymousMsg === false) {
      if (!createCommentDto.authorName || createCommentDto.authorName.trim() === '' || createCommentDto.authorName === '访客') {
        throw new HttpException('该纪念空间暂未开放匿名留言，请登录后留言', HttpStatus.FORBIDDEN);
      }
    }

    const [row] = await db.insert(comments).values({
      memorialId: createCommentDto.memorialId,
      authorName: createCommentDto.authorName,
      content: createCommentDto.content,
      ...(createCommentDto.authorAvatar ? { authorAvatar: createCommentDto.authorAvatar } : {}),
    }).returning();
    return row;
  }

  async deleteComment(id: string, authorName: string) {
    const [comment] = await db.select({ authorName: comments.authorName })
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    if (!comment) throw new Error('留言不存在');
    if (comment.authorName !== authorName) throw new Error('无权删除他人留言');

    await db.delete(comments).where(eq(comments.id, id));
    return { id };
  }
}