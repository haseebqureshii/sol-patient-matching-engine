import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  appointment_id: string;

  @Column('uuid')
  patient_id: string;

  @Column('uuid')
  advocate_id: string;

  @Column({ type: 'text', default: 'SCHEDULED' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}