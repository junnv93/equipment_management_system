import { Module } from '@nestjs/common';
import { TestSoftwareController } from './test-software.controller';
import { TestSoftwareService } from './test-software.service';
import { SoftwareValidationListener } from './listeners/software-validation.listener';

@Module({
  controllers: [TestSoftwareController],
  providers: [TestSoftwareService, SoftwareValidationListener],
  exports: [TestSoftwareService],
})
export class TestSoftwareModule {}
