import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): { status: string; data: string } {
    return {
      status: 'success',
      data: this.appService.getHello()
    };
  }

  @Get('health')
  getHealth(): { status: string; data: string } {
    return {
      status: 'success',
      data: new Date().toISOString(),
    };
  }

  // V2.0 埋点收集（前端统一上报，服务端落日志，便于后续分析）
  @Post('track')
  async track(@Body() body: { event?: string; ts?: number; extra?: unknown }) {
    try {
      const evt = body?.event || 'unknown';
      const extra = body?.extra ? JSON.stringify(body.extra) : '';
      console.log(`[track] ${evt}${extra ? ' | ' + extra : ''}`);
    } catch {
      /* 埋点失败不影响主流程 */
    }
    return { ok: true };
  }
}
