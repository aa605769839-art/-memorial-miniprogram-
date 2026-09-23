import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { db } from '../storage/database/drizzle';
import { memorials } from '../storage/database/shared/schema';

@Injectable()
export class RankingsService {
  async getRankings(type: string = 'mourning') {
    const column = type === 'visit' ? memorials.visitCount : memorials.mourningCount;
    return db.select().from(memorials).orderBy(desc(column)).limit(20);
  }
}