import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { MourningController, VisitController, CommentController } from './interactions.controller';

@Module({
  controllers: [MourningController, VisitController, CommentController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
