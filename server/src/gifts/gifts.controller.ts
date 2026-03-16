import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { InsertGift } from '../storage/database/shared/schema';

@Controller()
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  // 获取所有礼物记录（用于中台日志）
  @Get('gifts')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.giftsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // 获取礼物赠送记录列表（小程序端）
  @Get('gift-records')
  async findGiftRecords(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.giftsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // 获取某个纪念空间的所有礼物
  @Get('gifts/memorial/:memorialId')
  async findByMemorialId(@Param('memorialId') memorialId: string) {
    return this.giftsService.findByMemorialId(memorialId);
  }

  // 赠送礼物
  @Post('gifts')
  async create(@Body() createGiftDto: InsertGift) {
    return this.giftsService.create(createGiftDto);
  }
}
