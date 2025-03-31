import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
// Reservation 엔티티 임포트 제거 (Drizzle ORM 사용으로 인해)
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [
    // Drizzle DB는 app.module에서 전역으로 제공됨
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService]
})
export class ReservationsModule {} 