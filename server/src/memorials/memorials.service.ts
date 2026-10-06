import { Injectable } from '@nestjs/common';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorials, photos, comments, gifts, mourningRecords, memorialMembers } from '../storage/database/shared/schema';
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
      const rows = await query
        .where(and(eq(memorials.userId, userId), eq(memorials.isDeleted, false)))
        .orderBy(desc(memorials.createdAt));
      // 对缺失头像的故人做异步补全（不阻塞列表返回）
      rows.forEach((r) => {
        if (!this.isAvatarValid(r.avatarUrl)) {
          this.backfillAvatarAsync(r as unknown as AvatarCandidate).catch(() => {});
        }
      });
      return rows;
    }
    // 公开推荐流：仅展示公开且未逻辑删除的墓碑
    return query
      .where(and(
        eq(memorials.privacyType ?? 1, 1),
        eq(memorials.isDeleted ?? false, false)
      ))
      .orderBy(desc(memorials.createdAt));
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
      ...(createMemorialDto.nickName !== undefined ? { nickName: createMemorialDto.nickName } : {}),
      ...(createMemorialDto.gender !== undefined ? { gender: createMemorialDto.gender } : {}),
      ...(createMemorialDto.nationality !== undefined ? { nationality: createMemorialDto.nationality } : {}),
      ...(createMemorialDto.birthDate ? { birthDate: createMemorialDto.birthDate } : {}),
      ...(createMemorialDto.deathDate ? { deathDate: createMemorialDto.deathDate } : {}),
      ...(createMemorialDto.nativePlace !== undefined ? { nativePlace: createMemorialDto.nativePlace } : {}),
      ...(createMemorialDto.occupation !== undefined ? { occupation: createMemorialDto.occupation } : {}),
      ...(createMemorialDto.burialPlace !== undefined ? { burialPlace: createMemorialDto.burialPlace } : {}),
      ...(createMemorialDto.epitaph !== undefined ? { epitaph: createMemorialDto.epitaph } : {}),
      ...(createMemorialDto.biography !== undefined ? { biography: createMemorialDto.biography } : {}),
      ...(createMemorialDto.avatarUrl !== undefined ? { avatarUrl: createMemorialDto.avatarUrl } : {}),
      ...(createMemorialDto.coverImg !== undefined ? { coverImg: createMemorialDto.coverImg } : {}),
      ...(createMemorialDto.description !== undefined ? { description: createMemorialDto.description } : {}),
      ...(createMemorialDto.achievements !== undefined ? { achievements: createMemorialDto.achievements } : {}),
      ...(createMemorialDto.templateId !== undefined ? { templateId: createMemorialDto.templateId } : {}),
      ...(createMemorialDto.privacyType !== undefined ? { privacyType: createMemorialDto.privacyType } : {}),
      ...(createMemorialDto.accessPassword !== undefined ? { accessPassword: createMemorialDto.accessPassword } : {}),
      ...(createMemorialDto.allowAnonymousMsg !== undefined ? { allowAnonymousMsg: createMemorialDto.allowAnonymousMsg } : {}),
    }).returning();
    return row[0];
  }

  async update(id: string, updateMemorialDto: UpdateMemorial) {
    const values: Partial<typeof memorials.$inferInsert> = {};
    if (updateMemorialDto.name !== undefined) values.name = updateMemorialDto.name;
    if (updateMemorialDto.nickName !== undefined) values.nickName = updateMemorialDto.nickName;
    if (updateMemorialDto.gender !== undefined) values.gender = updateMemorialDto.gender;
    if (updateMemorialDto.nationality !== undefined) values.nationality = updateMemorialDto.nationality;
    if (updateMemorialDto.birthDate !== undefined) values.birthDate = updateMemorialDto.birthDate;
    if (updateMemorialDto.deathDate !== undefined) values.deathDate = updateMemorialDto.deathDate;
    if (updateMemorialDto.nativePlace !== undefined) values.nativePlace = updateMemorialDto.nativePlace;
    if (updateMemorialDto.occupation !== undefined) values.occupation = updateMemorialDto.occupation;
    if (updateMemorialDto.burialPlace !== undefined) values.burialPlace = updateMemorialDto.burialPlace;
    if (updateMemorialDto.epitaph !== undefined) values.epitaph = updateMemorialDto.epitaph;
    if (updateMemorialDto.biography !== undefined) values.biography = updateMemorialDto.biography;
    if (updateMemorialDto.avatarUrl !== undefined) values.avatarUrl = updateMemorialDto.avatarUrl;
    if (updateMemorialDto.coverImg !== undefined) values.coverImg = updateMemorialDto.coverImg;
    if (updateMemorialDto.description !== undefined) values.description = updateMemorialDto.description;
    if (updateMemorialDto.achievements !== undefined) values.achievements = updateMemorialDto.achievements;
    if (updateMemorialDto.templateId !== undefined) values.templateId = updateMemorialDto.templateId;
    if (updateMemorialDto.privacyType !== undefined) values.privacyType = updateMemorialDto.privacyType;
    if (updateMemorialDto.accessPassword !== undefined) values.accessPassword = updateMemorialDto.accessPassword;
    if (updateMemorialDto.allowAnonymousMsg !== undefined) values.allowAnonymousMsg = updateMemorialDto.allowAnonymousMsg;
    if (updateMemorialDto.isDeleted !== undefined) values.isDeleted = updateMemorialDto.isDeleted;
    values.updatedAt = new Date();

    const [row] = await db.update(memorials)
      .set(values)
      .where(eq(memorials.id, id))
      .returning();
    return row ?? null;
  }

  async remove(id: string) {
    // PRD：墓碑删除为逻辑删除（保留30天），前端二次确认
    await db.update(memorials)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(memorials.id, id));
    return { id };
  }

  // 用于排行榜筛选（保留按计数排序，兼容原接口语义）
  async findTopByCount(column: 'mourning_count' | 'visit_count', limit = 20) {
    if (column === 'visit_count') {
      return db.select().from(memorials).orderBy(desc(memorials.visitCount)).limit(limit);
    }
    return db.select().from(memorials).orderBy(desc(memorials.mourningCount)).limit(limit);
  }

  /** 校验访问密码（密码访问模式） */
  async verifyAccessPassword(id: string, password: string): Promise<boolean> {
    const [row] = await db.select({ accessPassword: memorials.accessPassword, privacyType: memorials.privacyType })
      .from(memorials)
      .where(eq(memorials.id, id))
      .limit(1);
    if (!row) return false;
    if (row.privacyType !== 3) return true; // 非密码访问无需校验
    if (!row.accessPassword) return false;
    return row.accessPassword === password;
  }

  /** 获取墓碑隐私信息（暴露最小字段给前端判定） */
  async getPrivacyMeta(id: string) {
    const [row] = await db
      .select({
        privacyType: memorials.privacyType,
        allowAnonymousMsg: memorials.allowAnonymousMsg,
        userId: memorials.userId,
      })
      .from(memorials)
      .where(eq(memorials.id, id))
      .limit(1);
    return row ?? null;
  }

  /** 标记墓碑访问（用于访问日志/访问次数） */
  async registerVisit(id: string, visitorName?: string) {
    return { id };
  }

  /** 计算某墓碑的纪念日节点（生辰/忌日/周年）。使用当前年月与逝者出生/逝世日月比对。 */
  private anniversaryOf(dateStr: string | null, curYear: number, curMonth: number, curDay: number): { month: number; day: number } | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return { month: d.getMonth() + 1, day: d.getDate() };
  }

  /** 汇总某用户关联墓碑的纪念日（供纪念日历使用） */
  async listAnniversaries(userId?: string) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();

    let rows;
    if (userId) {
      rows = await db.select().from(memorials)
        .where(and(eq(memorials.userId, userId), eq(memorials.isDeleted, false)));
    } else {
      rows = await db.select().from(memorials).where(eq(memorials.isDeleted, false));
    }

    const events: any[] = [];
    rows.forEach((mem) => {
      const birth = this.anniversaryOf(mem.birthDate, y, m, d);
      const death = this.anniversaryOf(mem.deathDate, y, m, d);

      if (birth) {
        let label = '生辰';
        if (birth.month === m && birth.day === d) label = '今日生辰';
        const deathYear = mem.deathDate ? new Date(mem.deathDate).getFullYear() : 0;
        const age = y - (mem.birthDate ? new Date(mem.birthDate).getFullYear() : y);
        events.push({
          memorialId: mem.id, name: mem.name, type: 'birth', label,
          month: birth.month, day: birth.day,
          note: `${label}${age >= 0 ? ` · ${age}岁` : ''}`,
          dateStr: mem.birthDate,
        });
      }
      if (death && mem.deathDate) {
        const deathYear = new Date(mem.deathDate).getFullYear();
        const years = y - deathYear;
        let label = years > 0 ? `${years}周年祭` : (years === 0 ? '当年忌日' : '忌日');
        if (death.month === m && death.day === d) label = `今日${label}`;
        events.push({
          memorialId: mem.id, name: mem.name, type: 'death', label,
          month: death.month, day: death.day,
          note: `${mem.name} · ${label}`,
          dateStr: mem.deathDate,
        });
      }
    });
    return events;
  }

  // ================= V2.0 首页聚合 =================

  /** 下一届纪念日（下一年度若本年度已过），返回距今天数（今日为 0） */
  private nextAnniversary(dateStr: string | null): { daysLeft: number } | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let cand = new Date(now.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (cand < today) cand = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate()).getTime();
    return { daysLeft: Math.round((cand - today) / 86400000) };
  }

  /** 首页轻量统计：纪念墓碑总数 / 今日献花数 / 家属参与数 / 今日祭拜人次 */
  async getHomeSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const memCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(memorials)
      .where(eq(memorials.isDeleted ?? false, false));

    const giftCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(gifts)
      .where(gte(gifts.createdAt, today));

    const memberCount = await db
      .select({ c: sql<number>`count(distinct ${memorialMembers.userId})` })
      .from(memorialMembers);

    const mournCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(mourningRecords)
      .where(gte(mourningRecords.createdAt, today));

    return {
      totalMemorials: Number(memCount[0]?.c ?? 0),
      todayGifts: Number(giftCount[0]?.c ?? 0),
      familyCount: Number(memberCount[0]?.c ?? 0),
      todayWorship: Number(mournCount[0]?.c ?? 0),
    };
  }

  /** 近期纪念日：user=本人关联 / 兜底公开墓碑，未来 N 天内的生辰/忌日 */
  async getUpcomingAnniversaries(userId?: string, days = 7) {
    let rows;
    if (userId) {
      rows = await db.select().from(memorials)
        .where(and(eq(memorials.userId, userId), eq(memorials.isDeleted, false)));
    } else {
      rows = await db.select().from(memorials).where(eq(memorials.isDeleted, false));
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upper = new Date(today.getTime() + days * 86400000);

    const out: any[] = [];
    rows.forEach((mem) => {
      const add = (type: 'birth' | 'death', dateStr: string | null) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        let cand = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (cand.getTime() < today.getTime()) cand = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
        if (cand.getTime() > upper.getTime()) return;
        const daysLeft = Math.round((cand.getTime() - today.getTime()) / 86400000);
        out.push({
          memorialId: mem.id,
          name: mem.name,
          gender: mem.gender,
          avatarUrl: mem.avatarUrl,
          type,
          label: type === 'birth' ? '生辰' : '忌日',
          date: cand.toISOString().slice(0, 10),
          daysLeft,
        });
      };
      add('birth', mem.birthDate);
      add('death', mem.deathDate);
    });
    out.sort((a, b) => a.daysLeft - b.daysLeft);
    return out;
  }

  /** 依据生肖/生平推断卡片标签（简化为墓碑已有内容） */
  private inferTags(mem: any): any[] {
    const tags: any[] = [];
    if (mem.biography) tags.push({ type: 'bio', label: '生平' });
    if (mem.occupation) tags.push({ type: 'occupation', label: mem.occupation });
    return tags.slice(0, 2);
  }

  private bioPreview(bio?: string | null): string {
    if (!bio) return '';
    return bio.length > 42 ? bio.slice(0, 42) + '…' : bio;
  }

  /**
   * 首页推荐流（分页）：当日纪念日 → 本人关联 → 未来7日临近 → 近期新建公开。
   */
  async findHomeRecommend(userId?: string, page = 1, pageSize = 10) {
    const rows = await db
      .select()
      .from(memorials)
      .where(and(eq(memorials.privacyType ?? 1, 1), eq(memorials.isDeleted ?? false, false)));

    const scored = rows.map((mem: any) => {
      const birth = this.nextAnniversary(mem.birthDate);
      const death = this.nextAnniversary(mem.deathDate);
      let ann: { daysLeft: number; type: 'birth' | 'death' } | null = null;
      if (birth && death) ann = death.daysLeft <= birth.daysLeft ? { ...death, type: 'death' } : { ...birth, type: 'birth' };
      else if (birth) ann = { ...birth, type: 'birth' };
      else if (death) ann = { ...death, type: 'death' };

      let score = 100;
      if (ann && ann.daysLeft === 0) score = 0;             // 当日纪念日
      else if (userId && mem.userId === userId) score = 10; // 本人关联
      else if (ann && ann.daysLeft <= 7) score = 30;        // 未来7日临近
      return { mem, score, ann };
    });

    scored.sort(
      (a, b) =>
        a.score - b.score ||
        new Date((b.mem as any).createdAt).getTime() - new Date((a.mem as any).createdAt).getTime()
    );

    const total = scored.length;
    const start = (page - 1) * pageSize;
    const pageRows = scored.slice(start, start + pageSize).map(({ mem, ann }) => {
      const tags: any[] = [...this.inferTags(mem)];
      if (ann && ann.daysLeft === 0) {
        tags.unshift({ type: 'today', label: ann.type === 'birth' ? '今日生辰' : '今日忌日' });
      } else if (ann && ann.daysLeft <= 7) {
        tags.unshift({ type: 'upcoming', label: `${ann.type === 'birth' ? '生辰' : '忌日'} ${ann.daysLeft}天后` });
      }
      if (userId && mem.userId === userId) tags.unshift({ type: 'mine', label: '我创建的' });
      return { ...mem, tags, preview: this.bioPreview(mem.biography) };
    });

    return { list: pageRows, page, pageSize, total, hasMore: start + pageRows.length < total };
  }
}