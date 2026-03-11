import { pgTable, serial, timestamp, text, varchar, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 墓碑表
export const memorials = pgTable(
  "memorials",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 128 }).notNull(), // 创建者ID
    name: varchar("name", { length: 128 }).notNull(),
    birthDate: timestamp("birth_date", { withTimezone: true, mode: 'string' }),
    deathDate: timestamp("death_date", { withTimezone: true, mode: 'string' }),
    avatarUrl: text("avatar_url"),
    description: text("description"),
    achievements: jsonb("achievements"),
    mourningCount: integer("mourning_count").notNull().default(0),
    visitCount: integer("visit_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("memorials_created_at_idx").on(table.createdAt),
    index("memorials_mourning_count_idx").on(table.mourningCount),
    index("memorials_user_id_idx").on(table.userId),
  ]
);

// 悼念记录表
export const mourningRecords = pgTable(
  "mourning_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    memorialId: varchar("memorial_id", { length: 36 }).notNull(),
    visitorName: varchar("visitor_name", { length: 128 }).notNull(),
    visitorAvatar: text("visitor_avatar"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("mourning_records_memorial_id_idx").on(table.memorialId),
    index("mourning_records_created_at_idx").on(table.createdAt),
  ]
);

// 拜访记录表
export const visitRecords = pgTable(
  "visit_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    memorialId: varchar("memorial_id", { length: 36 }).notNull(),
    visitorName: varchar("visitor_name", { length: 128 }).notNull(),
    visitorAvatar: text("visitor_avatar"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("visit_records_memorial_id_idx").on(table.memorialId),
    index("visit_records_created_at_idx").on(table.createdAt),
  ]
);

// 留言表
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    memorialId: varchar("memorial_id", { length: 36 }).notNull(),
    authorName: varchar("author_name", { length: 128 }).notNull(),
    authorAvatar: text("author_avatar"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("comments_memorial_id_idx").on(table.memorialId),
    index("comments_created_at_idx").on(table.createdAt),
  ]
);

// 照片表
export const photos = pgTable(
  "photos",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    memorialId: varchar("memorial_id", { length: 36 }).notNull(),
    url: text("url").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("photos_memorial_id_idx").on(table.memorialId),
    index("photos_order_idx").on(table.memorialId, table.orderIndex),
  ]
);

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertMemorialSchema = createCoercedInsertSchema(memorials).pick({
  userId: true,
  name: true,
  birthDate: true,
  deathDate: true,
  avatarUrl: true,
  description: true,
  achievements: true,
});

export const updateMemorialSchema = createCoercedInsertSchema(memorials)
  .pick({
    name: true,
    birthDate: true,
    deathDate: true,
    avatarUrl: true,
    description: true,
    achievements: true,
  })
  .partial();

export const insertMourningRecordSchema = createCoercedInsertSchema(mourningRecords).pick({
  memorialId: true,
  visitorName: true,
  visitorAvatar: true,
  message: true,
});

export const insertVisitRecordSchema = createCoercedInsertSchema(visitRecords).pick({
  memorialId: true,
  visitorName: true,
  visitorAvatar: true,
});

export const insertCommentSchema = createCoercedInsertSchema(comments).pick({
  memorialId: true,
  authorName: true,
  authorAvatar: true,
  content: true,
});

export const insertPhotoSchema = createCoercedInsertSchema(photos).pick({
  memorialId: true,
  url: true,
  orderIndex: true,
});

// TypeScript types
export type Memorial = typeof memorials.$inferSelect;
export type InsertMemorial = z.infer<typeof insertMemorialSchema>;
export type UpdateMemorial = z.infer<typeof updateMemorialSchema>;

export type MourningRecord = typeof mourningRecords.$inferSelect;
export type InsertMourningRecord = z.infer<typeof insertMourningRecordSchema>;

export type VisitRecord = typeof visitRecords.$inferSelect;
export type InsertVisitRecord = z.infer<typeof insertVisitRecordSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
