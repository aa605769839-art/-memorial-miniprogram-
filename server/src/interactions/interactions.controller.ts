import { Controller, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InsertMourningRecord, InsertVisitRecord, InsertComment } from '../storage/database/shared/schema';

@Controller('mourning')
export class MourningController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createMourning(@Body() createMourningDto: InsertMourningRecord) {
    return this.interactionsService.createMourning(createMourningDto);
  }
}

@Controller('visits')
export class VisitController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createVisit(@Body() createVisitDto: InsertVisitRecord) {
    return this.interactionsService.createVisit(createVisitDto);
  }
}

@Controller('comments')
export class CommentController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createComment(@Body() createCommentDto: InsertComment) {
    return this.interactionsService.createComment(createCommentDto);
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Query('authorName') authorName: string) {
    return this.interactionsService.deleteComment(id, authorName);
  }
}
