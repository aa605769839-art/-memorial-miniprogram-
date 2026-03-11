import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';

@Controller('memorials')
export class MemorialsController {
  constructor(private readonly memorialsService: MemorialsService) {}

  @Get()
  async findAll() {
    const result = await this.memorialsService.findAll();
    return { code: 200, msg: 'success', data: result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.memorialsService.findOne(id);
    return { code: 200, msg: 'success', data: result };
  }

  @Get(':id/comments')
  async findComments(@Param('id') id: string) {
    const result = await this.memorialsService.findComments(id);
    return { code: 200, msg: 'success', data: result };
  }

  @Post()
  async create(@Body() createMemorialDto: InsertMemorial) {
    const result = await this.memorialsService.create(createMemorialDto);
    return { code: 200, msg: 'success', data: result };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMemorialDto: UpdateMemorial) {
    const result = await this.memorialsService.update(id, updateMemorialDto);
    return { code: 200, msg: 'success', data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.memorialsService.remove(id);
    return { code: 200, msg: 'success', data: result };
  }
}
