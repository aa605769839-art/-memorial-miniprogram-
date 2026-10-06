import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { OfflinePhotosService } from './offline-photos.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('offline-photos')
export class OfflinePhotosController {
  constructor(private readonly offlinePhotosService: OfflinePhotosService) {}

  /** 查询墓碑线下悼念照片列表 */
  @Get('memorial/:memorialId')
  async list(@Param('memorialId') memorialId: string) {
    return this.offlinePhotosService.listByMemorial(memorialId);
  }

  /** 批量上传线下悼念照片（需登录） */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Req() req: any,
    @Body()
    body: {
      memorialId: string;
      nick?: string;
      worshipDate?: string | Date;
      message?: string;
      urls: string[];
    }
  ) {
    return this.offlinePhotosService.create({
      memorialId: body.memorialId,
      userId: req.user.id,
      nick: body.nick,
      worshipDate: body.worshipDate,
      message: body.message,
      urls: body.urls || [],
      isAdmin: req.user.role === 'admin',
    });
  }

  /** 墓碑是否允许访客上传线下照片（仅创建者/管理员） */
  @Put('setting/visitor-upload')
  @UseGuards(AuthGuard)
  async setVisitorUpload(
    @Req() req: any,
    @Body() body: { memorialId: string; allow: boolean }
  ) {
    const memorial = await this.offlinePhotosService.findMemorial(body.memorialId);
    if (!memorial) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }
    if (memorial.userId !== req.user.id && req.user.role !== 'admin') {
      throw new HttpException('无权修改此墓碑设置', HttpStatus.FORBIDDEN);
    }
    return this.offlinePhotosService.setVisitorUpload(body.memorialId, !!body.allow);
  }

  /** 删除线下悼念照片（上传者本人 / 管理员） */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.offlinePhotosService.remove(id, req.user.id, req.user.role === 'admin');
  }
}