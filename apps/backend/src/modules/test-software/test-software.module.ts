import { Module } from '@nestjs/common';
import { TestSoftwareController } from './test-software.controller';
import { TestSoftwareService } from './test-software.service';
import { SoftwareValidationListener } from './listeners/software-validation.listener';
import { TestSoftwareRegistryExportDataService } from './services/test-software-registry-export-data.service';
import { TestSoftwareRegistryRendererService } from './services/test-software-registry-renderer.service';

@Module({
  controllers: [TestSoftwareController],
  providers: [
    TestSoftwareService,
    SoftwareValidationListener,
    TestSoftwareRegistryExportDataService,
    TestSoftwareRegistryRendererService,
  ],
  exports: [
    TestSoftwareService,
    TestSoftwareRegistryExportDataService,
    TestSoftwareRegistryRendererService,
  ],
})
export class TestSoftwareModule {}
