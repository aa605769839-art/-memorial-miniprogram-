-- ============================================================
-- 纪念小程序 数据库初始化脚本 (PostgreSQL)
-- 对应 server/src/storage/database/shared/schema.ts
-- 幂等：可重复执行
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 墓碑表
CREATE TABLE IF NOT EXISTS memorials (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       varchar(128) NOT NULL,
  name          varchar(128) NOT NULL,
  gender        varchar(10),
  birth_date    timestamptz,
  death_date    timestamptz,
  avatar_url    text,
  description   text,
  achievements  jsonb,
  mourning_count integer NOT NULL DEFAULT 0,
  visit_count   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);
CREATE INDEX IF NOT EXISTS memorials_created_at_idx ON memorials (created_at);
CREATE INDEX IF NOT EXISTS memorials_mourning_count_idx ON memorials (mourning_count);
CREATE INDEX IF NOT EXISTS memorials_user_id_idx ON memorials (user_id);

-- 悼念记录表
CREATE TABLE IF NOT EXISTS mourning_records (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  visitor_name  varchar(128) NOT NULL,
  visitor_avatar text,
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mourning_records_memorial_id_idx ON mourning_records (memorial_id);
CREATE INDEX IF NOT EXISTS mourning_records_created_at_idx ON mourning_records (created_at);

-- 拜访记录表
CREATE TABLE IF NOT EXISTS visit_records (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  visitor_name  varchar(128) NOT NULL,
  visitor_avatar text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visit_records_memorial_id_idx ON visit_records (memorial_id);
CREATE INDEX IF NOT EXISTS visit_records_created_at_idx ON visit_records (created_at);

-- 留言表
CREATE TABLE IF NOT EXISTS comments (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  author_name   varchar(128) NOT NULL,
  author_avatar text,
  content       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_memorial_id_idx ON comments (memorial_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments (created_at);

-- 照片表
CREATE TABLE IF NOT EXISTS photos (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  url           text NOT NULL,
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_memorial_id_idx ON photos (memorial_id);
CREATE INDEX IF NOT EXISTS photos_order_idx ON photos (memorial_id, order_index);

-- 礼物配置表（中台配置）
CREATE TABLE IF NOT EXISTS gift_configs (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(128) NOT NULL,
  icon          text NOT NULL,
  color         varchar(50) DEFAULT 'text-pink-500',
  price         integer DEFAULT 0,
  sort_order    integer DEFAULT 0,
  is_enabled    boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gift_configs_sort_idx ON gift_configs (sort_order);
CREATE INDEX IF NOT EXISTS gift_configs_enabled_idx ON gift_configs (is_enabled);

-- 礼物表
CREATE TABLE IF NOT EXISTS gifts (
  id            varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   varchar(36) NOT NULL,
  gift_type     varchar(50) NOT NULL,
  gift_name     varchar(128) NOT NULL,
  gift_icon     text,
  sender_name   varchar(128) NOT NULL,
  sender_avatar text,
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gifts_memorial_id_idx ON gifts (memorial_id);
CREATE INDEX IF NOT EXISTS gifts_created_at_idx ON gifts (created_at);

-- 可选：默认礼物配置
INSERT INTO gift_configs (name, icon, color, price, sort_order, is_enabled)
SELECT * FROM (VALUES
  ('鲜花', '🌸', 'text-pink-500', 10, 1, true),
  ('蜡烛', '🕯️', 'text-amber-500', 20, 2, true),
  ('花圈', '⭕', 'text-slate-500', 50, 3, true),
  ('风筝', '🪁', 'text-sky-500', 30, 4, true)
) AS v(name, icon, color, price, sort_order, is_enabled)
WHERE NOT EXISTS (SELECT 1 FROM gift_configs);
-- V2.0：墓碑允许访客上传线下悼念照片
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS allow_visitor_offline boolean NOT NULL DEFAULT false;

-- V2.0：线下悼念照片表
CREATE TABLE IF NOT EXISTS memorial_offline_photo (
    id varchar(36) PRIMARY KEY,
    memorial_id varchar(36) NOT NULL,
    user_id varchar(128) NOT NULL,
    nick varchar(128) DEFAULT '',
    photo_url text NOT NULL,
    worship_date timestamp,
    message text,
    created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mem_offline_photo_memorial_idx ON memorial_offline_photo (memorial_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_user_idx ON memorial_offline_photo (user_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_created_idx ON memorial_offline_photo (created_at);
