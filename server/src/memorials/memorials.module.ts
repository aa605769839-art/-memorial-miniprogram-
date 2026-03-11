import { Module } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { MemorialsController } from './memorials.controller';
import { ImageGenerationController } from './image-generation.controller';

@Module({
  controllers: [MemorialsController, ImageGenerationController],
  providers: [MemorialsService],
  exports: [MemorialsService],
})
export class MemorialsModule {}
