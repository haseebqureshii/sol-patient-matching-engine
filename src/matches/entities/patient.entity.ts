import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryColumn('uuid')
  patient_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  needs_profile: string;
}