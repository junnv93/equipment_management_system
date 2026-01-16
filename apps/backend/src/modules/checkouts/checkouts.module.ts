import { Module } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsService } from './checkouts.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    EquipmentModule, // EquipmentService 사용을 위해 필요
    CacheModule, // SimpleCacheService 사용을 위해 필요
  ],
  controllers: [CheckoutsController],
  providers: [CheckoutsService],
  exports: [CheckoutsService],
})
export class CheckoutsModule {}
