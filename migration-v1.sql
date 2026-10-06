-- ============================================
-- 「晚星纪念」PRD V1.0 数据库迁移脚本
-- 目标：阿里云 ECS /opt/memorial 的 PostgreSQL（memorial-postgres 容器）
-- 执行方式：docker exec -i memorial-postgres psql -U <user> -d <database> < /opt/memorial/migration-v1.sql
-- 说明：均为幂等增量变更，可重复执行
-- ============================================

-- 1. memorials 表补充字段（PRD 5.1 创建表单 / 5.6 隐私）
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS nick_name varchar(128);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS nationality varchar(32);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS native_place varchar(128);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS occupation varchar(128);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS burial_place varchar(255);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS epitaph text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS biography text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS cover_img text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS template_id integer DEFAULT 1;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS privacy_type integer DEFAULT 1;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS access_password varchar(64);
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS allow_anonymous_msg boolean DEFAULT true;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 2. 家属成员表（PRD 5.4 / 8.2）
CREATE TABLE IF NOT EXISTS memorial_members (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id varchar(36) NOT NULL,
  user_id varchar(128) NOT NULL,
  role integer NOT NULL DEFAULT 4,                    -- 1主管理员 2家属管理员 3可编辑 4仅浏览
  nickname varchar(64),
  invite_status integer NOT NULL DEFAULT 1,            -- 1待确认 2已接受 3已拒绝
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memorial_members_memorial_id_idx ON memorial_members (memorial_id);
CREATE INDEX IF NOT EXISTS memorial_members_user_id_idx ON memorial_members (user_id);

-- 3. 访问日志表（PRD 5.6.3 / 8.x）
CREATE TABLE IF NOT EXISTS visit_logs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id varchar(36) NOT NULL,
  visitor_name varchar(128) DEFAULT '匿名访客',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visit_logs_memorial_id_idx ON visit_logs (memorial_id);
CREATE INDEX IF NOT EXISTS visit_logs_created_at_idx ON visit_logs (created_at);

-- 4. 操作日志表（PRD FR-002）
CREATE TABLE IF NOT EXISTS operation_logs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id varchar(36),
  user_id varchar(128),
  action varchar(64),
  detail jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS operation_logs_memorial_id_idx ON operation_logs (memorial_id);
CREATE INDEX IF NOT EXISTS operation_logs_created_at_idx ON operation_logs (created_at);

-- 5. 历史数据：为已有墓碑补默认 allow_anonymous_msg / privacy_type
UPDATE memorials SET privacy_type = 1 WHERE privacy_type IS NULL;
UPDATE memorials SET allow_anonymous_msg = true WHERE allow_anonymous_msg IS NULL;
UPDATE memorials SET is_deleted = false WHERE is_deleted IS NULL;
-- 创建人自动加入家属成员表（角色=主管理员）
INSERT INTO memorial_members (memorial_id, user_id, role, invite_status)
SELECT id, user_id, 1, 2 FROM memorials
ON CONFLICT DO NOTHING;