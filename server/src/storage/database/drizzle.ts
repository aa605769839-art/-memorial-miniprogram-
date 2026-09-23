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