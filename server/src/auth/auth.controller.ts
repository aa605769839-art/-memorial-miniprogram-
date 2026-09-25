import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string; nickname?: string }) {
    const data = await this.authService.register(body.username, body.password, body.nickname);
    return { code: 200, msg: '注册成功', data };
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const data = await this.authService.login(body.username, body.password);
    return { code: 200, msg: '登录成功', data };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: any) {
    const data = await this.authService.me(req.user.id);
    return { code: 200, msg: 'success', data };
  }
}