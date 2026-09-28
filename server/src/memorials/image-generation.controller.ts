import { Controller, Post, Body } from '@nestjs/common';
import { ImageGenerationClient, Config } from 'coze-coding-dev-sdk';

@Controller('generate-avatar')
export class ImageGenerationController {
  @Post()
  async generateAvatar(@Body() body: { prompt: string }) {
    try {
      const cleanPrompt = (body.prompt || '')
        .replace(/[\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const config = new Config();
      const client = new ImageGenerationClient(config);

      const response = await client.generate({
        prompt: cleanPrompt,
        size: '2048x2048',
        watermark: false,
      });

      const helper = client.getResponseHelper(response);
      const imageUrl = helper.imageUrls?.[0];
      if (!helper.success || !imageUrl) {
        console.error('Image generation failed:', helper.errorMessages);
        return { code: 500, msg: helper.errorMessages.join('; ') || 'AI图像生成服务无有效返回' };
      }

      return { code: 200, msg: 'success', data: imageUrl };
    } catch (error) {
      console.error('Error generating avatar:', error);
      return { code: 500, msg: 'Internal server error' };
    }
  }
}