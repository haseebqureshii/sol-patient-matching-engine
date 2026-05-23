import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Advocate } from '../../advocates/entities/advocate.entity';
import { Patient } from './patient.entity';

@Entity('match_scores')
export class MatchScore {
  @PrimaryColumn()
  patient_id: number;

  @PrimaryColumn()
  advocate_id: number;

  @Index('idx_patient_scores') 
  @Column({ type: 'float' })
  score: number;

  // Relational mapping so TypeORM can fetch the nested advocate data
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Advocate)
  @JoinColumn({ name: 'advocate_id' })
  advocate: Advocate;
}