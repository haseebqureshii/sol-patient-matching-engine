import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AdvocatesService } from './advocates.service';

@Controller('advocates')
export class AdvocatesController {
  constructor(private readonly advocatesService: AdvocatesService) {}

  @Get()
  findAll() {
    return this.advocatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.advocatesService.findOne(id);
  }
}