import { Module } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { MemorialsController } from './memorials.controller';
import { ImageGenerationController } from './image-generation.controller';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [PhotosModule],
  controllers: [MemorialsController, ImageGenerationController],
  providers: [MemorialsService],
  exports: [MemorialsService],
})
export class MemorialsModule {}
