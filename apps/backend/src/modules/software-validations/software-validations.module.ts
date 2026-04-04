import { Module } from '@nestjs/common';
import {
  SoftwareValidationsController,
  TestSoftwareValidationsController,
} from './software-validations.controller';
import { SoftwareValidationsService } from './software-validations.service';

@Module({
  controllers: [TestSoftwareValidationsController, SoftwareValidationsController],
  providers: [SoftwareValidationsService],
  exports: [SoftwareValidationsService],
})
export class SoftwareValidationsModule {}
