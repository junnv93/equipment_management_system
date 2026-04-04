import { Module } from '@nestjs/common';
import { TestSoftwareController } from './test-software.controller';
import { TestSoftwareService } from './test-software.service';

@Module({
  controllers: [TestSoftwareController],
  providers: [TestSoftwareService],
  exports: [TestSoftwareService],
})
export class TestSoftwareModule {}
