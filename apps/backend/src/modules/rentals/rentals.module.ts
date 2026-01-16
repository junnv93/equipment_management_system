import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    EquipmentModule, // EquipmentService 사용을 위해 필요
    CacheModule, // SimpleCacheService 사용을 위해 필요
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
