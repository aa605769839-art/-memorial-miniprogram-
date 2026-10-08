import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';

/**
 * 独立的 PostgreSQL 数据访问层（Drizzle ORM）。
 *
 * 本模块不再依赖任何 Coze 平台或 Supabase 服务，
 * 直接连接到独立部署的 PostgreSQL（通过 DATABASE_URL）。
 *
 * 示例：DATABASE_URL=postgres://user:pass@host:5432/dbname
 */

// 校验并构造连接串
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

// 简单适配：允许通过各个分项拼装连接串（便于 docker 环境变量注入）
function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const {
    PG_HOST,
    PG_PORT,
    PG_USER,
    PG_PASSWORD,
    PG_DATABASE,
  } = process.env;
  if (PG_HOST && PG_USER && PG_DATABASE) {
    const port = PG_PORT || '5432';
    const auth = PG_PASSWORD ? `${PG_USER}:${PG_PASSWORD}` : PG_USER;
    return `postgres://${auth}@${PG_HOST}:${port}/${PG_DATABASE}`;
  }
  throw new Error('DATABASE_URL (or PG_HOST/PG_USER/PG_DATABASE) is not set');
}

const connectionString = buildConnectionString();

export const pool = new Pool({ connectionString });

export type Database = NodePgDatabase<typeof schema>;

export const db: Database = drizzle(pool, { schema });

export default db;

/**
 * 启动自迁移：确保 V2.0 新增表 / 字段存在（幂等，可重复执行）。
 * 无数据库连接时静默降级，不阻断服务启动。
 */
export async function ensureSchema(): Promise<void> {
  const ddl = `
CREATE TABLE IF NOT EXISTS memorial_offline_photo (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  user_id       varchar(128) NOT NULL,
  nick          varchar(128),
  photo_url     text NOT NULL,
  worship_date  timestamptz,
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mem_offline_photo_memorial_idx ON memorial_offline_photo (memorial_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_user_idx ON memorial_offline_photo (user_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_created_idx ON memorial_offline_photo (created_at);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS allow_visitor_offline boolean NOT NULL DEFAULT false;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS tribute_value integer NOT NULL DEFAULT 0;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;
`;
  try {
    await pool.query(ddl);
    console.log('[ensureSchema] V2.0 DB schema 已同步');
  } catch (e) {
    // 仅在有连接配置时才告警；缺 DATABASE_URL 时属于开发环境，可正常忽略
    if (process.env.DATABASE_URL || process.env.PG_HOST) {
      console.warn('[ensureSchema] DB schema 同步失败: ' + (e as Error).message);
    }
  }
}