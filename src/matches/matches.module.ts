import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchScore } from './entities/match-score.entity';
import { Patient } from './entities/patient.entity';
import { Appointment } from './entities/appointment.entity';
import Redis from 'ioredis';

@Module({
  imports: [TypeOrmModule.forFeature([MatchScore, Patient, Appointment])],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: '127.0.0.1', 
          port: 6379,
        });
      },
    },
  ],
})
export class MatchesModule {}