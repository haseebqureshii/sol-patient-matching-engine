import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchScore } from './entities/match-score.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(MatchScore)
    private matchScoreRepository: Repository<MatchScore>,
  ) {}

  async getTopMatches(patientId: number, limit: number = 5) {
    const matches = await this.matchScoreRepository.find({
      where: { patient_id: patientId },
      order: { score: 'DESC' },
      take: limit,
      relations: {
        advocate: true, // <-- FIXED: TypeORM 0.3+ requires an object instead of an array
      },
    });

    if (!matches || matches.length === 0) {
      throw new NotFoundException(`No matches found for patient ID ${patientId}`);
    }

    return matches.map(match => ({
      advocateId: match.advocate.advocate_id,
      name: match.advocate.name,
      specialty: match.advocate.specialty,
      matchScore: match.score,
    }));
  }
}