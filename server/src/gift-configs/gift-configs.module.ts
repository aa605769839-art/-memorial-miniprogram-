import { Module } from '@nestjs/common';
import { GiftConfigsController } from './gift-configs.controller';
import { GiftConfigsService } from './gift-configs.service';

@Module({
  controllers: [GiftConfigsController],
  providers: [GiftConfigsService],
})
export class GiftConfigsModule {}
