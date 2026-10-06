-- ============================================================
-- V2.0 二期迭代 - 数据库迁移
-- 说明：本脚本为幂等，可在任意环境重复执行。
-- 生产环境已通过后端启动自迁移(ensureSchema)自动应用；此文件供手工/存档使用。
-- 执行：psql "$DATABASE_URL" -f v2_offline_photos.sql
-- ============================================================

-- 1) 墓碑表新增：是否允许访客上传线下悼念照片（默认关闭）
ALTER TABLE memorials
  ADD COLUMN IF NOT EXISTS allow_visitor_offline boolean NOT NULL DEFAULT false;

-- 2) 线下悼念照片表
CREATE TABLE IF NOT EXISTS memorial_offline_photo (
    id           varchar(36) PRIMARY KEY,
    memorial_id  varchar(36) NOT NULL,
    user_id      varchar(128) NOT NULL,
    nick         varchar(128) DEFAULT '',
    photo_url    text        NOT NULL,
    worship_date timestamp,
    message      text,
    created_at   timestamp   NOT NULL DEFAULT now()
);

-- 3) 索引
CREATE INDEX IF NOT EXISTS mem_offline_photo_memorial_idx ON memorial_offline_photo (memorial_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_user_idx ON memorial_offline_photo (user_id);
CREATE INDEX IF NOT EXISTS mem_offline_photo_created_idx ON memorial_offline_photo (created_at);