-- 为 memorials 表添加 gender 字段
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
