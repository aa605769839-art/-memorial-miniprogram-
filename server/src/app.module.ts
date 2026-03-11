import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MemorialsModule } from './memorials/memorials.module';
import { InteractionsModule } from './interactions/interactions.module';
import { RankingsModule } from './rankings/rankings.module';

@Module({
  imports: [MemorialsModule, InteractionsModule, RankingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
