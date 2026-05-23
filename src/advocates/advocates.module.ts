import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvocatesService } from './advocates.service';
import { AdvocatesController } from './advocates.controller';
import { Advocate } from './entities/advocate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Advocate])],
  controllers: [AdvocatesController],
  providers: [AdvocatesService],
})
export class AdvocatesModule {}