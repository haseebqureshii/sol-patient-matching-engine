import { Controller, Get, Post, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('patients')
  async getPatients() {
    return await this.matchesService.getDemoPatients();
  }

  @Get()
  async getMatches(@Query('patientId', ParseUUIDPipe) patientId: string) {
    return await this.matchesService.getTopMatches(patientId);
  }

  @Post('book')
  async bookAdvocate(@Body() body: { patientId: string; advocateId: string }) {
    return await this.matchesService.bookAdvocate(body.patientId, body.advocateId);
  }
}