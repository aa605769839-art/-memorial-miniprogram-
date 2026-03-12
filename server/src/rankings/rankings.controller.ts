import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  async getRankings(@Query('type') type: string = 'mourning') {
    return this.rankingsService.getRankings(type);
  }
}
