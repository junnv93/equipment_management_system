import { Module } from '@nestjs/common';
import { CablesController } from './cables.controller';
import { CablesService } from './cables.service';
import { CablePathLossExportDataService } from './services/cable-path-loss-export-data.service';
import { CablePathLossRendererService } from './services/cable-path-loss-renderer.service';

@Module({
  controllers: [CablesController],
  providers: [CablesService, CablePathLossExportDataService, CablePathLossRendererService],
  exports: [CablesService, CablePathLossExportDataService, CablePathLossRendererService],
})
export class CablesModule {}
