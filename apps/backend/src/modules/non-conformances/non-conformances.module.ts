import { Module, forwardRef } from '@nestjs/common';
import { NonConformancesController } from './non-conformances.controller';
import { NonConformancesService } from './non-conformances.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { FileUploadModule } from '../../common/file-upload/file-upload.module';

@Module({
  // FileUploadModule: DocumentService 주입 (첨부 업로드/조회/삭제)
  imports: [forwardRef(() => EquipmentModule), FileUploadModule],
  controllers: [NonConformancesController],
  providers: [NonConformancesService],
  exports: [NonConformancesService],
})
export class NonConformancesModule {}
