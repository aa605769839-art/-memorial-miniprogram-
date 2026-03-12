import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { InsertGift } from '../storage/database/shared/schema';

@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  // 获取某个纪念空间的所有礼物
  @Get('memorial/:memorialId')
  async findByMemorialId(@Param('memorialId') memorialId: string) {
    return this.giftsService.findByMemorialId(memorialId);
  }

  // 赠送礼物
  @Post()
  async create(@Body() createGiftDto: InsertGift) {
    return this.giftsService.create(createGiftDto);
  }
}
