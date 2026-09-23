-- 迁移：为 memorials 表添加 gender 字段
-- 执行方式：在 Supabase SQL Editor 中执行以下语句

ALTER TABLE memorials ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

