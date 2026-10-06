import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorialMembers, memorials } from '../storage/database/shared/schema';

/** 角色：1主管理员 2家属管理员 3可编辑 4仅浏览 */
export const ROLE = { OWNER: 1, ADMIN: 2, EDITOR: 3, VIEWER: 4 } as const;

@Injectable()
export class MembersService {
  /** 查询某墓碑下的所有成员 */
  async findByMemorial(memorialId: string) {
    return db.select()
      .from(memorialMembers)
      .where(eq(memorialMembers.memorialId, memorialId))
      .orderBy(memorialMembers.role);
  }

  /** 查询用户对某墓碑的角色（不属于则返回 null） */
  async getRole(memorialId: string, userId: string): Promise<number | null> {
    // 创建者视为主管理员
    const [memorial] = await db.select({ userId: memorials.userId })
      .from(memorials)
      .where(eq(memorials.id, memorialId))
      .limit(1);
    if (memorial && memorial.userId === userId) return ROLE.OWNER;

    const [member] = await db.select({ role: memorialMembers.role })
      .from(memorialMembers)
      .where(and(eq(memorialMembers.memorialId, memorialId), eq(memorialMembers.userId, userId)))
      .limit(1);
    return member?.role ?? null;
  }

  /** 当前用户是否有某墓碑的管理权限（主管理员/家属管理员） */
  async canManage(memorialId: string, userId: string): Promise<boolean> {
    const role = await this.getRole(memorialId, userId);
    return role === ROLE.OWNER || role === ROLE.ADMIN;
  }

  /** 当前用户是否可编辑某墓碑内容（主管理员/家属管理员/可编辑） */
  async canEdit(memorialId: string, userId: string): Promise<boolean> {
    const role = await this.getRole(memorialId, userId);
    return role === ROLE.OWNER || role === ROLE.ADMIN || role === ROLE.EDITOR;
  }

  /** 添加家属成员（仅主管理员/家属管理员可操作，且当前用户覆盖保护） */
  async addMember(memorialId: string, operatorUserId: string, body: {
    userId?: string;
    username?: string;
    role?: number;
    nickname?: string;
  }) {
    if (!(await this.canManage(memorialId, operatorUserId))) {
      throw new HttpException('无权限管理家属成员', HttpStatus.FORBIDDEN);
    }
    if (!body.userId && !body.username) {
      throw new HttpException('缺少邀请对象', HttpStatus.BAD_REQUEST);
    }

    const targetUserId = body.userId || body.username!;
    // 防止把自己降级
    if (targetUserId === operatorUserId) {
      throw new HttpException('不能邀请自己', HttpStatus.BAD_REQUEST);
    }

    const role = body.role ?? ROLE.VIEWER;
    const [existing] = await db.select().from(memorialMembers)
      .where(and(eq(memorialMembers.memorialId, memorialId), eq(memorialMembers.userId, targetUserId)))
      .limit(1);
    if (existing) {
      throw new HttpException('该成员已在墓碑成员列表中', HttpStatus.BAD_REQUEST);
    }

    const [row] = await db.insert(memorialMembers).values({
      memorialId,
      userId: targetUserId,
      role,
      nickname: body.nickname,
      inviteStatus: 1, // 待确认
    }).returning();
    return row;
  }

  /** 修改成员角色（仅主管理员/家属管理员，且不能改主管理员） */
  async updateRole(memorialId: string, operatorUserId: string, memberId: string, role: number) {
    if (!(await this.canManage(memorialId, operatorUserId))) {
      throw new HttpException('无权限管理家属成员', HttpStatus.FORBIDDEN);
    }
    const [member] = await db.select().from(memorialMembers)
      .where(eq(memorialMembers.id, memberId)).limit(1);
    if (!member) throw new HttpException('成员不存在', HttpStatus.NOT_FOUND);
    if (member.role === ROLE.OWNER || member.userId === operatorUserId) {
      throw new HttpException('不能修改主管理员或自己的角色', HttpStatus.BAD_REQUEST);
    }
    const [row] = await db.update(memorialMembers)
      .set({ role })
      .where(eq(memorialMembers.id, memberId))
      .returning();
    return row;
  }

  /** 移除成员（仅主管理员/家属管理员） */
  async removeMember(memorialId: string, operatorUserId: string, memberId: string) {
    if (!(await this.canManage(memorialId, operatorUserId))) {
      throw new HttpException('无权限管理家属成员', HttpStatus.FORBIDDEN);
    }
    const [member] = await db.select().from(memorialMembers)
      .where(eq(memorialMembers.id, memberId)).limit(1);
    if (!member) throw new HttpException('成员不存在', HttpStatus.NOT_FOUND);
    if (member.role === ROLE.OWNER) {
      throw new HttpException('不能移除主管理员', HttpStatus.BAD_REQUEST);
    }
    await db.delete(memorialMembers).where(eq(memorialMembers.id, memberId));
    return { id: memberId };
  }

  /** 移交主管理员（仅当前主管理员可，完成后自己降级为家属管理员） */
  async transferOwner(memorialId: string, operatorUserId: string, targetUserId: string) {
    const currentRole = await this.getRole(memorialId, operatorUserId);
    if (currentRole !== ROLE.OWNER) {
      throw new HttpException('仅主管理员可移交身份', HttpStatus.FORBIDDEN);
    }
    if (targetUserId === operatorUserId) {
      throw new HttpException('不能移交给自己', HttpStatus.BAD_REQUEST);
    }
    // 更新墓碑创建人
    const [memorial] = await db.update(memorials)
      .set({ userId: targetUserId })
      .where(eq(memorials.id, memorialId))
      .returning();
    if (!memorial) throw new HttpException('墓碑不存在', HttpStatus.NOT_FOUND);

    // 目标用户加入为家属管理员（若已在，提升为主管理员）
    const [existing] = await db.select().from(memorialMembers)
      .where(and(eq(memorialMembers.memorialId, memorialId), eq(memorialMembers.userId, targetUserId)))
      .limit(1);
    if (existing) {
      await db.update(memorialMembers).set({ role: ROLE.OWNER })
        .where(eq(memorialMembers.id, existing.id));
    } else {
      await db.insert(memorialMembers).values({
        memorialId, userId: targetUserId, role: ROLE.OWNER, inviteStatus: 2,
      });
    }
    // 原创建人降级为家属管理员
    const [oldMember] = await db.select().from(memorialMembers)
      .where(and(eq(memorialMembers.memorialId, memorialId), eq(memorialMembers.userId, operatorUserId)))
      .limit(1);
    if (oldMember) {
      await db.update(memorialMembers).set({ role: ROLE.ADMIN })
        .where(eq(memorialMembers.id, oldMember.id));
    }
    return { id: memorialId, newOwner: targetUserId };
  }
}