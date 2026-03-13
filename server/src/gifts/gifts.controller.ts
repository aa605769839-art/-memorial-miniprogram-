import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { InsertGift } from '../storage/database/shared/schema';

@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  // 获取所有礼物记录（用于中台日志）
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.giftsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

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
