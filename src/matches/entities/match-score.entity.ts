import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Advocate } from '../../advocates/entities/advocate.entity';
import { Patient } from './patient.entity';

@Entity('match_scores')
export class MatchScore {
  @PrimaryColumn()
  patient_id: string;

  @PrimaryColumn()
  advocate_id: string;

  @Index('idx_patient_scores') // Explicitly defining the index we created in Postgres
  @Column({ type: 'float' })
  score: number;

  // These relations allow TypeORM to automatically fetch the advocate details
  // when we query the match_scores table.
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Advocate)
  @JoinColumn({ name: 'advocate_id' })
  advocate: Advocate;
}