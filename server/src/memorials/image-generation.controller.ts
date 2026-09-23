import { Controller, Post, Body } from '@nestjs/common';

@Controller('generate-avatar')
export class ImageGenerationController {
  @Post()
  async generateAvatar(@Body() body: { prompt: string }) {
    try {
      const apiUrl = process.env.IMAGE_API_URL;
      const apiKey = process.env.IMAGE_API_KEY;
      const model = process.env.IMAGE_API_MODEL;

      if (!apiUrl || !apiKey) {
        return {
          code: 503,
          msg: 'AI图像生成服务未配置，请设置 IMAGE_API_URL / IMAGE_API_KEY 环境变量',
        };
      }

      const cleanPrompt = (body.prompt || '')
        .replace(/[\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'dall-e-3',
          prompt: cleanPrompt,
          n: 1,
          size: '1024x1024',
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('Image generation failed:', response.status, errText);
        return { code: response.status || 500, msg: 'AI图像生成服务暂不可用' };
      }

      const data = await response.json() as { data?: Array<{ url?: string }> };
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) {
        return { code: 500, msg: 'AI图像生成服务无有效返回' };
      }

      return { code: 200, msg: 'success', data: imageUrl };
    } catch (error) {
      console.error('Error generating avatar:', error);
      return { code: 500, msg: 'Internal server error' };
    }
  }
}