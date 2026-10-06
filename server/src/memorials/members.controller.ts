import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('memorials/:memorialId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // 获取墓碑成员列表
  @Get()
  @UseGuards(AuthGuard)
  async list(@Param('memorialId') memorialId: string, @Req() req: any) {
    const can = await this.membersService.canManage(memorialId, req.user.id);
    if (!can) throw new HttpException('无权限查看家属成员', HttpStatus.FORBIDDEN);
    return this.membersService.findByMemorial(memorialId);
  }

  // 邀请家属
  @Post()
  @UseGuards(AuthGuard)
  async invite(@Param('memorialId') memorialId: string, @Req() req: any, @Body() body: any) {
    return this.membersService.addMember(memorialId, req.user.id, {
      userId: body.userId,
      username: body.username,
      role: body.role,
      nickname: body.nickname,
    });
  }

  // 修改角色
  @Put(':memberId/role')
  @UseGuards(AuthGuard)
  async changeRole(
    @Param('memorialId') memorialId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
    @Body() body: { role: number },
  ) {
    return this.membersService.updateRole(memorialId, req.user.id, memberId, body.role);
  }

  // 移除成员
  @Delete(':memberId')
  @UseGuards(AuthGuard)
  async remove(@Param('memorialId') memorialId: string, @Param('memberId') memberId: string, @Req() req: any) {
    return this.membersService.removeMember(memorialId, req.user.id, memberId);
  }

  // 移交主管理员
  @Post('transfer')
  @UseGuards(AuthGuard)
  async transfer(@Param('memorialId') memorialId: string, @Req() req: any, @Body() body: { userId: string }) {
    if (!body.userId) throw new HttpException('缺少目标用户', HttpStatus.BAD_REQUEST);
    return this.membersService.transferOwner(memorialId, req.user.id, body.userId);
  }

  // 查询（当前）用户对某墓碑的角色
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Param('memorialId') memorialId: string, @Req() req: any) {
    return { role: await this.membersService.getRole(memorialId, req.user.id) };
  }
}