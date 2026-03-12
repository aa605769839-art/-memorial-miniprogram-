import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { GiftConfigsService } from './gift-configs.service';
import { InsertGiftConfig, UpdateGiftConfig } from '../storage/database/shared/schema';

@Controller('gift-configs')
export class GiftConfigsController {
  constructor(private readonly giftConfigsService: GiftConfigsService) {}

  @Get()
  async findAll() {
    const result = await this.giftConfigsService.findAll();
    return { code: 200, msg: 'success', data: result };
  }

  @Get('enabled')
  async findEnabled() {
    const result = await this.giftConfigsService.findEnabled();
    return { code: 200, msg: 'success', data: result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.giftConfigsService.findOne(id);
    return { code: 200, msg: 'success', data: result };
  }

  @Post()
  async create(@Body() createGiftConfigDto: InsertGiftConfig) {
    const result = await this.giftConfigsService.create(createGiftConfigDto);
    return { code: 200, msg: 'success', data: result };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGiftConfigDto: UpdateGiftConfig) {
    const result = await this.giftConfigsService.update(id, updateGiftConfigDto);
    return { code: 200, msg: 'success', data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.giftConfigsService.remove(id);
    return { code: 200, msg: 'success', data: { id } };
  }

  @Put(':id/sort')
  async updateSort(@Param('id') id: string, @Body('sortOrder') sortOrder: number) {
    const result = await this.giftConfigsService.updateSort(id, sortOrder);
    return { code: 200, msg: 'success', data: result };
  }
}
