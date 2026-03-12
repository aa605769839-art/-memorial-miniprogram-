import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { GiftConfigsService } from './gift-configs.service';
import { InsertGiftConfig, UpdateGiftConfig } from '../storage/database/shared/schema';

@Controller('gift-configs')
export class GiftConfigsController {
  constructor(private readonly giftConfigsService: GiftConfigsService) {}

  @Get()
  async findAll() {
    return this.giftConfigsService.findAll();
  }

  @Get('enabled')
  async findEnabled() {
    return this.giftConfigsService.findEnabled();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.giftConfigsService.findOne(id);
  }

  @Post()
  async create(@Body() createGiftConfigDto: InsertGiftConfig) {
    return this.giftConfigsService.create(createGiftConfigDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGiftConfigDto: UpdateGiftConfig) {
    return this.giftConfigsService.update(id, updateGiftConfigDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.giftConfigsService.remove(id);
    return { id };
  }

  @Put(':id/sort')
  async updateSort(@Param('id') id: string, @Body('sortOrder') sortOrder: number) {
    return this.giftConfigsService.updateSort(id, sortOrder);
  }
}
