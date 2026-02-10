import { Module, forwardRef } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';
import { CheckoutsService } from './checkouts.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { TeamsModule } from '../teams/teams.module';
import { CacheModule } from '../../common/cache/cache.module';
import { EquipmentImportsModule } from '../equipment-imports/equipment-imports.module';

@Module({
  imports: [
    EquipmentModule, // EquipmentService 사용을 위해 필요
    TeamsModule, // TeamsService 사용을 위해 필요
    CacheModule, // SimpleCacheService 사용을 위해 필요
    forwardRef(() => EquipmentImportsModule), // 순환 의존성 방지 (렌탈 반납 콜백)
  ],
  controllers: [CheckoutsController],
  providers: [CheckoutsService],
  exports: [CheckoutsService],
})
export class CheckoutsModule {}
