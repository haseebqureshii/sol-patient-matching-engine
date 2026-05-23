import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // Endpoint: GET /matches?patientId=123
  @Get()
  async getMatches(@Query('patientId', ParseIntPipe) patientId: number) {
    return await this.matchesService.getTopMatches(patientId);
  }
}