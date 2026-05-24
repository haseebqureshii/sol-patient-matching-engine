import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AdvocatesService } from './advocates.service';

@Controller('advocates')
export class AdvocatesController {
  constructor(private readonly advocatesService: AdvocatesService) {}

  @Get()
  findAll() {
    return this.advocatesService.findAll();
  }

  // FIXED: ParseUUIDPipe instead of ParseIntPipe
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.advocatesService.findOne(id);
  }
}