import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
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
    const result = await this.memorialsService.findAll(userId);
    return { code: 200, msg: 'success', data: result };
  }

  @Post('polish-text')
  async polishText(@Body() body: { text: string }) {
    if (!body.text || body.text.trim().length === 0) {
      return { code: 400, msg: '文本内容不能为空', data: null };
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

      return { code: 200, msg: 'success', data: { polishedText: response.content } };
    } catch (error) {
      console.error('AI润色失败:', error);
      return { code: 500, msg: 'AI润色服务暂不可用，请稍后再试', data: null };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.memorialsService.findOneWithPhotos(id);
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
  async remove(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      return { code: 400, msg: '用户ID不能为空', data: null };
    }

    // 先查询 memorial 验证权限
    const memorial = await this.memorialsService.findOne(id);
    if (!memorial) {
      return { code: 404, msg: '故友不存在', data: null };
    }

    // 验证是否是创建者
    if (memorial.user_id !== userId) {
      return { code: 403, msg: '无权删除此故友', data: null };
    }

    const result = await this.memorialsService.remove(id);
    return { code: 200, msg: 'success', data: result };
  }
}
