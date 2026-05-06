import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  Permission,
  FILE_UPLOAD_LIMITS,
  REPORT_EXPORT_MIME,
  MIME_TO_MAGIC_BYTES,
} from '@equipment-management/shared-constants';
import { ErrorCode, type ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import { THROTTLE_PRESETS, throttleAllNamed } from '../../common/config/throttle.constants';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CertificateExtractorService } from './services/certificate-extractor.service';
import type { MulterFile } from '../../types/common.types';

/**
 * 교정성적서 PDF → 표지 메타데이터 추출 (Phase A — HCT 양식, dry-run).
 *
 * Composition 원칙:
 * - 이 controller는 PDF→meta만 처리 (DB 저장 없음).
 * - 등록은 기존 `POST /calibration` (multipart) 재사용 — 새 staging/preflight 인프라 0.
 *
 * 보안 9-layer (defense in depth — 모두 SSOT 경유):
 *   1. mime whitelist  — `REPORT_EXPORT_MIME.pdf` (multer fileFilter)
 *   2. magic byte      — `MIME_TO_MAGIC_BYTES` SSOT 참조 inline 검증
 *   3. file size limit — `FILE_UPLOAD_LIMITS.MAX_FILE_SIZE`
 *   4. pdftotext timeout 15s — service `runPdfToText`
 *   5. maxBuffer 10MB   — service `runPdfToText`
 *   6. unguessable temp path — service `generateOpaqueId`
 *   7. permission gate — `Permission.CREATE_CALIBRATION`
 *   8. rate limit      — `THROTTLE_PRESETS.UPLOAD`
 *   9. audit log       — `@AuditLog({ action: 'extract', entityType: 'calibration_certificate' })`
 *
 * ErrorCode SSOT 5-layer:
 *   - {@link ErrorCode.CalibrationCertificateFormatUnsupported} (HCT 마커 미발견)
 *   - {@link ErrorCode.CalibrationCertificateExtractionFailed} (pdftotext fail / magic byte mismatch)
 *   - {@link ErrorCode.CalibrationCertificateFieldMissing} (필수 필드 누락 — `details.field`)
 */
@ApiTags('Calibration Certificates')
@ApiBearerAuth()
@Controller('calibration/certificates')
export class CalibrationCertificateController {
  /**
   * PDF magic byte — `MIME_TO_MAGIC_BYTES` SSOT에서 빌드 시 도출. 기동 시 1회 evaluate.
   * SSOT misconfiguration이면 module bootstrap 자체가 fail (intentional invariant).
   */
  private static readonly PDF_MAGIC_BYTES: Buffer = (() => {
    const sequences = MIME_TO_MAGIC_BYTES.get(REPORT_EXPORT_MIME.pdf);
    if (!sequences || sequences.length === 0 || sequences[0].length === 0) {
      // NOTE: module-load 시점 SSOT 정합성 startup-fail invariant.
      // HTTP 응답 경로 아님 → ErrorCode 적용 부적합. verify-zod Step 16 명시 예외.
      throw new Error(
        `[CalibrationCertificateController] SSOT misconfiguration: MIME_TO_MAGIC_BYTES has no entry for ${REPORT_EXPORT_MIME.pdf}.`
      );
    }
    return Buffer.from(sequences[0]);
  })();

  constructor(private readonly extractor: CertificateExtractorService) {}

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '교정성적서 PDF 표지 메타 추출 (DB 변경 없음)',
    description:
      'HCT 양식 PDF에서 표지의 핵심 메타데이터(관리번호, 성적서번호, 교정일자, 차기교정일, 수정 정보)를 추출합니다. ' +
      'DB 변경 없음 — 추출 결과로 frontend가 calibration 등록 폼을 사전 채우고, 사용자 검증 후 기존 `POST /calibration` 흐름으로 진입합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '교정성적서 PDF (HCT 양식, 최대 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '추출 성공 — extracted metadata 반환' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'CALIBRATION_CERTIFICATE_FORMAT_UNSUPPORTED (HCT 마커 미발견) / ' +
      'CALIBRATION_CERTIFICATE_EXTRACTION_FAILED (pdftotext 실패 / magic byte 불일치) / ' +
      'CALIBRATION_CERTIFICATE_FIELD_MISSING (필드 누락 — `details.field`)',
  })
  @RequirePermissions(Permission.CREATE_CALIBRATION)
  @Throttle(throttleAllNamed(THROTTLE_PRESETS.UPLOAD))
  @AuditLog({ action: 'extract', entityType: 'calibration_certificate' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== REPORT_EXPORT_MIME.pdf) {
          return cb(
            new BadRequestException({
              code: ErrorCode.CalibrationCertificateFormatUnsupported,
              message: 'PDF 파일만 업로드 가능합니다.',
            }),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  async extract(@UploadedFile() file: MulterFile): Promise<ExtractedCalibrationCertificate> {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationFileRequired,
        message: 'PDF 파일을 업로드해 주세요.',
      });
    }
    if (file.size === 0) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateExtractionFailed,
        message: '빈 파일입니다.',
      });
    }
    this.assertPdfMagicBytes(file.buffer);
    return this.extractor.extractFromBuffer(file.buffer);
  }

  /**
   * Magic byte 검증 — mime spoofing 방어 (defense in depth Layer 2).
   * 클라이언트가 mimetype을 위조해도 buffer 내용이 PDF가 아니면 차단.
   */
  private assertPdfMagicBytes(buffer: Buffer): void {
    const magic = CalibrationCertificateController.PDF_MAGIC_BYTES;
    if (buffer.length < magic.length || !buffer.subarray(0, magic.length).equals(magic)) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateExtractionFailed,
        message: '파일 내용이 PDF 형식과 일치하지 않습니다.',
      });
    }
  }
}
