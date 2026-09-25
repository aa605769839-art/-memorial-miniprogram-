import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GiftConfigsService } from './gift-configs.service';
import { InsertGiftConfig, UpdateGiftConfig } from '../storage/database/shared/schema';
import { AuthGuard, Roles } from '../auth/auth.guard';

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
  @UseGuards(AuthGuard)
  @Roles('admin')
  async create(@Body() createGiftConfigDto: InsertGiftConfig) {
    return this.giftConfigsService.create(createGiftConfigDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateGiftConfigDto: UpdateGiftConfig) {
    return this.giftConfigsService.update(id, updateGiftConfigDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.giftConfigsService.remove(id);
    return { id };
  }

  @Put(':id/sort')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async updateSort(@Param('id') id: string, @Body('sortOrder') sortOrder: number) {
    return this.giftConfigsService.updateSort(id, sortOrder);
  }
}
