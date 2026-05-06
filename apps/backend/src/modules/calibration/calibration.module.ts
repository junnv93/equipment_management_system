import { Module } from '@nestjs/common';
import { CalibrationService } from './calibration.service';
import { CalibrationController } from './calibration.controller';
import { CalibrationCertificateController } from './calibration-certificate.controller';
import { CertificateExtractorService } from './services/certificate-extractor.service';
// FileUploadService는 FileUploadModule(@Global)에서 전역 제공

@Module({
  controllers: [CalibrationController, CalibrationCertificateController],
  providers: [CalibrationService, CertificateExtractorService],
  exports: [CalibrationService, CertificateExtractorService],
})
export class CalibrationModule {}
