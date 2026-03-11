import { Module } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { MemorialsController } from './memorials.controller';

@Module({
  controllers: [MemorialsController],
  providers: [MemorialsService],
  exports: [MemorialsService],
})
export class MemorialsModule {}
