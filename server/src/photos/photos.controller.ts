import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { InsertPhoto } from '../storage/database/shared/schema';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('memorial/:memorialId')
  async findByMemorial(@Param('memorialId') memorialId: string) {
    return this.photosService.findByMemorialId(memorialId);
  }

  @Post()
  async create(@Body() createPhotoDto: InsertPhoto) {
    return this.photosService.create(createPhotoDto);
  }

  @Post('batch/:memorialId')
  async createBatch(
    @Param('memorialId') memorialId: string,
    @Body() body: { urls: string[] }
  ) {
    return this.photosService.createBatch(memorialId, body.urls);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.photosService.remove(id);
  }

  @Delete('memorial/:memorialId')
  async removeByMemorialId(@Param('memorialId') memorialId: string) {
    return this.photosService.removeByMemorialId(memorialId);
  }
}
