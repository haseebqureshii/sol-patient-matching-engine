import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchScore } from './entities/match-score.entity';
import { Patient } from './entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MatchScore, Patient])],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}