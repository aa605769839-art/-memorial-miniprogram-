import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  async getRankings(@Query('type') type: string = 'mourning') {
    const result = await this.rankingsService.getRankings(type);
    return { code: 200, msg: 'success', data: result };
  }
}
