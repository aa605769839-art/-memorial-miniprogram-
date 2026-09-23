import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { PhotosService } from '../photos/photos.service';
import { GiftsService } from '../gifts/gifts.service';
import { InsertMemorial, UpdateMemorial } from '../storage/database/shared/schema';

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
      const apiUrl = process.env.LLM_API_URL;
      const apiKey = process.env.LLM_API_KEY;
      const model = process.env.LLM_MODEL;

      if (!apiUrl || !apiKey) {
        throw new HttpException('AI润色服务未配置，请设置 LLM_API_URL / LLM_API_KEY 环境变量', HttpStatus.SERVICE_UNAVAILABLE);
      }

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '你是一位专业的文本润色专家，擅长让文字更加优美、感人、富有纪念意义。保持原意不变，仅优化语言表达和排版格式。'
            },
            {
              role: 'user',
              content: `请帮我润色以下文本：\n\n${body.text}`
            }
          ],
          temperature: 0.8
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('LLM润色失败:', response.status, errText);
        throw new HttpException('AI润色服务暂不可用，请稍后再试', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const polishedText = data.choices?.[0]?.message?.content?.trim();
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
    if (memorial.userId !== userId) {
      throw new HttpException('无权删除此故友', HttpStatus.FORBIDDEN);
    }

    return this.memorialsService.remove(id);
  }
}
