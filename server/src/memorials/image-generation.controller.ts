import { Controller, Post, Body, Request } from '@nestjs/common';
import { ImageGenerationClient, Config, HeaderUtils, APIError } from 'coze-coding-dev-sdk';

@Controller('generate-avatar')
export class ImageGenerationController {
  @Post()
  async generateAvatar(@Body() body: { prompt: string }, @Request() req) {
    try {
      // 提取请求头并转发
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);

      const config = new Config();
      const client = new ImageGenerationClient(config, customHeaders);

      console.log('Generating avatar with prompt:', body.prompt.substring(0, 100) + '...');

      const response = await client.generate({
        prompt: body.prompt,
        size: '2K',
        watermark: false,
      });

      const helper = client.getResponseHelper(response);

      if (helper.success && helper.imageUrls.length > 0) {
        return { code: 200, msg: 'success', data: helper.imageUrls[0] };
      } else {
        console.error('Image generation failed:', helper.errorMessages);
        return { code: 500, msg: 'Image generation failed', error: helper.errorMessages };
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      if (error instanceof APIError) {
        console.error('API Error status:', error.statusCode);
        return { code: error.statusCode || 500, msg: error.message };
      }
      return { code: 500, msg: 'Internal server error' };
    }
  }
}
