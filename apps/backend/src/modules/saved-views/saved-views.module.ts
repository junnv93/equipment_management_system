import { Module } from '@nestjs/common';

import { SavedViewsController } from './saved-views.controller';
import { SavedViewsService } from './saved-views.service';
import { SavedViewsTeamListener } from './listeners/saved-views-team.listener';
import { CacheModule } from '../../common/cache/cache.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CacheModule, AuditModule],
  controllers: [SavedViewsController],
  providers: [SavedViewsService, SavedViewsTeamListener],
  exports: [SavedViewsService],
})
export class SavedViewsModule {}
