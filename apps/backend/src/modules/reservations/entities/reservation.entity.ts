import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';
import { ReservationStatus as ReservationStatusType, ReservationStatusEnum } from '@equipment-management/schemas';

// schemas 패키지의 값을 가져와 로컬에서 사용하기 위한 열거형 정의
export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED'
}

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  equipmentId: string;

  @ManyToOne(() => Equipment, equipment => equipment.reservations)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  purpose: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING
  })
  status: ReservationStatus;

  @Column({ nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ nullable: true })
  completedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completedById' })
  completedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 