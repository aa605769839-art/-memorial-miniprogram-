import { Module } from '@nestjs/common';
import { OfflinePhotosService } from './offline-photos.service';
import { OfflinePhotosController } from './offline-photos.controller';
import { MemorialsModule } from '../memorials/memorials.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MemorialsModule, AuthModule],
  controllers: [OfflinePhotosController],
  providers: [OfflinePhotosService],
  exports: [OfflinePhotosService],
})
export class OfflinePhotosModule {}