import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { db } from '../storage/database/drizzle';
import { users } from '../storage/database/shared/schema';
import { User } from '../storage/database/shared/schema';

interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly tokenSecret: string;
  private readonly tokenTtlSec = 7 * 24 * 3600; // 7 天

  constructor() {
    // 生产环境务必注入 AUTH_SECRET；未配置时退回随机密钥（重启后 token 失效）
    this.tokenSecret = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
  }

  signToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.tokenTtlSec,
    };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyToken(token: string): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('无效的登录凭证');
    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    const a = Buffer.from(signature, 'base64url');
    const b = Buffer.from(expected, 'base64url');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException('登录凭证无效或已过期');
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    return payload;
  }

  sanitize(user: User) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar_url: user.avatarUrl,
      role: user.role,
      created_at: user.createdAt,
    };
  }

  async register(username: string, password: string, nickname?: string) {
    const uname = username?.trim();
    if (!uname || !password) {
      throw new BadRequestException('账号和密码不能为空');
    }
    if (uname.length < 3 || uname.length > 32) {
      throw new BadRequestException('账号长度需在 3-32 位之间');
    }
    if (password.length < 6) {
      throw new BadRequestException('密码长度至少 6 位');
    }
    const [existing] = await db.select({ id: users.id }).from(users)
      .where(eq(users.username, uname)).limit(1);
    if (existing) {
      throw new ConflictException('该账号已被注册');
    }
    const [row] = await db.insert(users).values({
      username: uname,
      passwordHash: this.hashPassword(password),
      ...(nickname?.trim() ? { nickname: nickname.trim() } : {}),
    }).returning();
    const token = this.signToken(row);
    return { token, user: this.sanitize(row) };
  }

  async login(username: string, password: string) {
    const uname = username?.trim();
    if (!uname || !password) {
      throw new BadRequestException('账号和密码不能为空');
    }
    const [row] = await db.select().from(users)
      .where(eq(users.username, uname)).limit(1);
    if (!row || !this.verifyPassword(password, row.passwordHash)) {
      throw new UnauthorizedException('账号或密码错误');
    }
    if (!row.isEnabled) {
      throw new UnauthorizedException('该账号已被禁用');
    }
    const token = this.signToken(row);
    return { token, user: this.sanitize(row) };
  }

  async me(userId: string) {
    const [row] = await db.select().from(users)
      .where(eq(users.id, userId)).limit(1);
    if (!row) throw new UnauthorizedException('用户不存在');
    return this.sanitize(row);
  }
}