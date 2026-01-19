import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { IntermediateCheckScheduler } from './schedulers/intermediate-check-scheduler';
import { CalibrationModule } from '../calibration/calibration.module';

@Module({
  imports: [forwardRef(() => CalibrationModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, IntermediateCheckScheduler],
  exports: [NotificationsService, IntermediateCheckScheduler],
})
export class NotificationsModule {}
