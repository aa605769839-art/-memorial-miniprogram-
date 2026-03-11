import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { InsertPhoto } from '../storage/database/shared/schema';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('memorial/:memorialId')
  async findByMemorial(@Param('memorialId') memorialId: string) {
    const result = await this.photosService.findByMemorialId(memorialId);
    return { code: 200, msg: 'success', data: result };
  }

  @Post()
  async create(@Body() createPhotoDto: InsertPhoto) {
    const result = await this.photosService.create(createPhotoDto);
    return { code: 200, msg: 'success', data: result };
  }

  @Post('batch/:memorialId')
  async createBatch(
    @Param('memorialId') memorialId: string,
    @Body() body: { urls: string[] }
  ) {
    const result = await this.photosService.createBatch(memorialId, body.urls);
    return { code: 200, msg: 'success', data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.photosService.remove(id);
    return { code: 200, msg: 'success', data: result };
  }

  @Delete('memorial/:memorialId')
  async removeByMemorialId(@Param('memorialId') memorialId: string) {
    const result = await this.photosService.removeByMemorialId(memorialId);
    return { code: 200, msg: 'success', data: result };
  }
}
