import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('advocates')
export class Advocate {
  @PrimaryColumn('uuid')
  advocate_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  specialty: string;
}