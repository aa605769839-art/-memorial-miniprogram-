import { Controller, Post, Body } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InsertMourningRecord, InsertVisitRecord, InsertComment } from '../storage/database/shared/schema';

@Controller('mourning')
export class MourningController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createMourning(@Body() createMourningDto: InsertMourningRecord) {
    const result = await this.interactionsService.createMourning(createMourningDto);
    return { code: 200, msg: 'success', data: result };
  }
}

@Controller('visits')
export class VisitController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createVisit(@Body() createVisitDto: InsertVisitRecord) {
    const result = await this.interactionsService.createVisit(createVisitDto);
    return { code: 200, msg: 'success', data: result };
  }
}

@Controller('comments')
export class CommentController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createComment(@Body() createCommentDto: InsertComment) {
    const result = await this.interactionsService.createComment(createCommentDto);
    return { code: 200, msg: 'success', data: result };
  }
}
