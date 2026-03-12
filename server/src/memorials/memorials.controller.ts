import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { PhotosService } from '../photos/photos.service';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Controller('memorials')
export class MemorialsController {
  constructor(
    private readonly memorialsService: MemorialsService,
    private readonly photosService: PhotosService
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

      const messages = [
        {
          role: 'system' as const,
          content: '你是一位专业的文本润色专家，擅长让文字更加优美、感人、富有纪念意义。保持原意不变，仅优化语言表达和排版格式。'
        },
        {
          role: 'user' as const,
          content: `请帮我润色以下文本：\n\n${body.text}`
        }
      ];

      const response = await client.invoke(messages, { temperature: 0.8 });

      return { polishedText: response.content };
    } catch (error) {
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

  @Post()
  async create(@Body() createMemorialDto: InsertMemorial) {
    return this.memorialsService.create(createMemorialDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMemorialDto: UpdateMemorial) {
    return this.memorialsService.update(id, updateMemorialDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('用户ID不能为空', HttpStatus.BAD_REQUEST);
    }

    // 先查询 memorial 验证权限
    const memorial = await this.memorialsService.findOne(id);
    if (!memorial) {
      throw new HttpException('故友不存在', HttpStatus.NOT_FOUND);
    }

    // 验证是否是创建者
    if (memorial.user_id !== userId) {
      throw new HttpException('无权删除此故友', HttpStatus.FORBIDDEN);
    }

    return this.memorialsService.remove(id);
  }
}
