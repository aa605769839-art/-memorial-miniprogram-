import { Injectable } from '@nestjs/common';
import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { giftConfigs } from '../storage/database/shared/schema';
import { InsertGiftConfig, UpdateGiftConfig } from '../storage/database/shared/schema';

@Injectable()
export class GiftConfigsService {
  async findAll() {
    return db.select().from(giftConfigs)
      .orderBy(asc(giftConfigs.sortOrder), desc(giftConfigs.createdAt));
  }

  async findEnabled() {
    return db.select().from(giftConfigs)
      .where(eq(giftConfigs.isEnabled, true))
      .orderBy(asc(giftConfigs.sortOrder));
  }

  async findOne(id: string) {
    const [row] = await db.select().from(giftConfigs)
      .where(eq(giftConfigs.id, id))
      .limit(1);
    return row ?? null;
  }

  async create(createGiftConfigDto: InsertGiftConfig) {
    const [row] = await db.insert(giftConfigs).values({
      name: createGiftConfigDto.name,
      icon: createGiftConfigDto.icon,
      color: createGiftConfigDto.color ?? 'text-pink-500',
      price: createGiftConfigDto.price ?? 0,
      sortOrder: createGiftConfigDto.sortOrder ?? 0,
      isEnabled: createGiftConfigDto.isEnabled ?? true,
    }).returning();
    return row;
  }

  async update(id: string, updateGiftConfigDto: UpdateGiftConfig) {
    const values: Record<string, any> = {};
    if (updateGiftConfigDto.name !== undefined) values.name = updateGiftConfigDto.name;
    if (updateGiftConfigDto.icon !== undefined) values.icon = updateGiftConfigDto.icon;
    if (updateGiftConfigDto.color !== undefined) values.color = updateGiftConfigDto.color;
    if (updateGiftConfigDto.price !== undefined) values.price = updateGiftConfigDto.price;
    if (updateGiftConfigDto.sortOrder !== undefined) values.sortOrder = updateGiftConfigDto.sortOrder;
    if (updateGiftConfigDto.isEnabled !== undefined) values.isEnabled = updateGiftConfigDto.isEnabled;

    const [row] = await db.update(giftConfigs)
      .set(values)
      .where(eq(giftConfigs.id, id))
      .returning();
    return row ?? null;
  }

  async updateSort(id: string, sortOrder: number) {
    const [row] = await db.update(giftConfigs)
      .set({ sortOrder })
      .where(eq(giftConfigs.id, id))
      .returning();
    return row ?? null;
  }

  async remove(id: string) {
    await db.delete(giftConfigs).where(eq(giftConfigs.id, id));
    return { id };
  }
}