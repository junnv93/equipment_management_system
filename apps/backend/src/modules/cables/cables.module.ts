import { Module } from '@nestjs/common';
import { CablesController } from './cables.controller';
import { CablesService } from './cables.service';

@Module({
  controllers: [CablesController],
  providers: [CablesService],
  exports: [CablesService],
})
export class CablesModule {}
