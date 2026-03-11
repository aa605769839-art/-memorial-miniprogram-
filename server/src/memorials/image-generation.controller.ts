import { Controller, Post, Body, Request } from '@nestjs/common';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

@Controller('generate-avatar')
export class ImageGenerationController {
  @Post()
  async generateAvatar(@Body() body: { prompt: string }, @Request() req) {
    try {
      // 提取请求头并转发
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);

      const config = new Config();
      const client = new ImageGenerationClient(config, customHeaders);

      const response = await client.generate({
        prompt: body.prompt,
        size: '2K',
        watermark: false,
      });

      const helper = client.getResponseHelper(response);

      if (helper.success && helper.imageUrls.length > 0) {
        return { code: 200, msg: 'success', data: helper.imageUrls[0] };
      } else {
        return { code: 500, msg: 'Image generation failed', error: helper.errorMessages };
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      return { code: 500, msg: 'Internal server error' };
    }
  }
}
