import { Module } from '@nestjs/common';
import { NonConformancesController } from './non-conformances.controller';
import { NonConformancesService } from './non-conformances.service';

@Module({
  controllers: [NonConformancesController],
  providers: [NonConformancesService],
  exports: [NonConformancesService],
})
export class NonConformancesModule {}
