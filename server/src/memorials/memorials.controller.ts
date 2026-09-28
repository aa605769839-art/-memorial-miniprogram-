import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { PhotosService } from '../photos/photos.service';
import { GiftsService } from '../gifts/gifts.service';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';
import { AuthGuard } from '../auth/auth.guard';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Controller('memorials')
export class MemorialsController {
  constructor(
    private readonly memorialsService: MemorialsService,
    private readonly photosService: PhotosService,
    private readonly giftsService: GiftsService
  ) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    return this.memorialsService.findAll(userId);
  }

  @Post('polish-text')
  async polishText(@Body() body: { text: string }) {
    if (!body.text || body.text.trim().length === 0) {
      throw new HttpException('文本内容不能为空', HttpStatus.BAD_REQUEST);
    }

    try {
      const config = new Config();
      const client = new LLMClient(config);

      const response = await client.invoke(
        [
          {
            role: 'system',
            content: '你是一位专业的文本润色专家，擅长让文字更加优美、感人、富有纪念意义。保持原意不变，仅优化语言表达和排版格式。'
          },
          {
            role: 'user',
            content: `请帮我润色以下文本：\n\n${body.text}`
          }
        ],
        { model: 'doubao-seed-2-0-lite-260215', temperature: 0.8 }
      );

      const polishedText = response.content?.trim();
      if (!polishedText) {
        throw new HttpException('AI润色服务无有效返回，请稍后再试', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return { polishedText };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('AI润色失败:', error);
      throw new HttpException('AI润色服务暂不可用，请稍后再试', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.memorialsService.findOneWithPhotos(id);
  }

  @Get(':id/comments')
  async findComments(@Param('id') id: string) {
    return this.memorialsService.findComments(id);
  }

  // 获取指定故人的礼物记录
  @Get(':id/gifts')
  async findGifts(@Param('id') id: string) {
    return this.giftsService.findByMemorialId(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req: any, @Body() createMemorialDto: InsertMemorial) {
    // 强制使用登录用户作为创建者
    return this.memorialsService.create({ ...createMemorialDto, userId: req.user.id });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Req() req: any, @Param('id') id: string, @Body() updateMemorialDto: UpdateMemorial) {
    // 仅创建者可编辑
    const memorial = await this.memorialsService.findOne(id);
    if (!memorial) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }
    if (memorial.userId !== req.user.id) {
      throw new HttpException('无权编辑此故友', HttpStatus.FORBIDDEN);
    }
    return this.memorialsService.update(id, updateMemorialDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    // 先查询 memorial 验证权限
    const memorial = await this.memorialsService.findOne(id);
    if (!memorial) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }

    // 验证是否是创建者（管理员可删除任意）
    if (memorial.userId !== req.user.id && req.user.role !== 'admin') {
      throw new HttpException('无权删除此故友', HttpStatus.FORBIDDEN);
    }

    return this.memorialsService.remove(id);
  }
}
