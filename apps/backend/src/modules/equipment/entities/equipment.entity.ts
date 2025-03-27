import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum EquipmentStatusEnum {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  CALIBRATION = 'CALIBRATION',
  RETIRED = 'RETIRED'
}

@Entity()
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  managementNumber: string;

  @Column({ nullable: true })
  assetNumber: string;

  @Column()
  modelName: string;

  @Column()
  manufacturer: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatusEnum,
    default: EquipmentStatusEnum.AVAILABLE
  })
  status: EquipmentStatusEnum;

  @Column({ nullable: true })
  purchaseDate: Date;

  @Column({ nullable: true })
  lastCalibrationDate: Date;

  @Column({ nullable: true })
  nextCalibrationDate: Date;

  @Column({ nullable: true })
  calibrationCycle: number;

  @Column({ default: false })
  isCalibrationRequired: boolean;

  @Column({ nullable: true })
  teamId: string;

  @Column({ nullable: true })
  responsiblePersonId: string;

  @OneToMany(() => Reservation, reservation => reservation.equipment)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 