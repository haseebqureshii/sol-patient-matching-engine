import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchScore } from './entities/match-score.entity';
import { Appointment } from './entities/appointment.entity';
import { Patient } from './entities/patient.entity';
import Redis from 'ioredis';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(MatchScore)
    private matchScoreRepository: Repository<MatchScore>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>, 
    @Inject('REDIS_CLIENT') private readonly redis: Redis, 
  ) {}

  // 1. Fetch patients for the new UI dropdown
  async getDemoPatients() {
    return await this.patientRepository.find({
      take: 5,
    });
  }

  // 2. Fetch the top advocate matches for a specific patient
  async getTopMatches(patientId: string, limit: number = 5) {
    const matches = await this.matchScoreRepository.find({
      where: { patient_id: patientId },
      order: { score: 'DESC' },
      take: limit,
      relations: { advocate: true },
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

  // 3. The Redis-locked concurrency booking engine
  async bookAdvocate(patientId: string, advocateId: string) {
    const lockKey = `lock:advocate:${advocateId}`;
    
    // Attempt to acquire lock
    const acquired = await this.redis.set(lockKey, 'locked', 'PX', 5000, 'NX');

    if (!acquired) {
      throw new ConflictException('High demand: Advocate is currently being booked by another patient. Please try again.');
    }

    try {
      // Create and save the appointment
      const appointment = this.appointmentRepository.create({
        patient_id: patientId,
        advocate_id: advocateId
      });
      await this.appointmentRepository.save(appointment);

      return { 
        status: 'success', 
        message: 'Advocate booked successfully',
        appointmentId: appointment.appointment_id
      };
    } finally {
      // Always release the lock
      await this.redis.del(lockKey);
    }
  }
}