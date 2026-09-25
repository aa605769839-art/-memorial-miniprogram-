import { Module } from '@nestjs/common';
import { GiftConfigsController } from './gift-configs.controller';
import { GiftConfigsService } from './gift-configs.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GiftConfigsController],
  providers: [GiftConfigsService],
})
export class GiftConfigsModule {}
