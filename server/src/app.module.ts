import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { MemorialsModule } from './memorials/memorials.module';
import { InteractionsModule } from './interactions/interactions.module';
import { RankingsModule } from './rankings/rankings.module';
import { UploadModule } from './upload/upload.module';
import { PhotosModule } from './photos/photos.module';
import { GiftsModule } from './gifts/gifts.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [MemorialsModule, InteractionsModule, RankingsModule, UploadModule, PhotosModule, GiftsModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
