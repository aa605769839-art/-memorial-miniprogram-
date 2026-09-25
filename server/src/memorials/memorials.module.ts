import { Module } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { MemorialsController } from './memorials.controller';
import { ImageGenerationController } from './image-generation.controller';
import { PhotosModule } from '../photos/photos.module';
import { GiftsModule } from '../gifts/gifts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PhotosModule, GiftsModule, AuthModule],
  controllers: [MemorialsController, ImageGenerationController],
  providers: [MemorialsService],
  exports: [MemorialsService],
})
export class MemorialsModule {}
