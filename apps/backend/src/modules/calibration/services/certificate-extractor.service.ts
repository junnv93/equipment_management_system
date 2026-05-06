import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { generateOpaqueId } from '../../../common/identifiers/identifier.service';
import {
  ErrorCode,
  extractedCalibrationCertificateSchema,
  type ExtractedCalibrationCertificate,
} from '@equipment-management/schemas';

const execFileAsync = promisify(execFile);

/**
 * HCT 양식 감지 키워드 — 발급기관 식별 (다중 매칭으로 변조/오인식 회피).
 */
const HCT_FORM_MARKERS = ['주식회사 에이치시티', 'Certificate of Calibration'] as const;

/**
 * 교정성적서 PDF 표지 메타데이터 추출 서비스.
 *
 * Phase A 범위:
 * - HCT 양식만 지원 (전체 교정의 90%+)
 * - 표지 1페이지 텍스트만 파싱 (측정값 표는 별도 Phase B)
 * - dry-run 추출 — DB 저장 전 사용자 검증 단계용
 *
 * 의존: poppler-utils의 `pdftotext` 바이너리 (PATH에 존재해야 함).
 */
@Injectable()
export class CertificateExtractorService {
  private readonly logger = new Logger(CertificateExtractorService.name);

  async extractFromBuffer(pdfBuffer: Buffer): Promise<ExtractedCalibrationCertificate> {
    const text = await this.runPdfToText(pdfBuffer);
    return this.parseHctCoverPage(text);
  }

  /**
   * 표지 텍스트에서 4개 핵심 필드 + revision 정보를 추출.
   * 단위 테스트가 fixture text로 직접 호출하는 진입점.
   */
  parseHctCoverPage(text: string): ExtractedCalibrationCertificate {
    if (!HCT_FORM_MARKERS.every((marker) => text.includes(marker))) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateFormatUnsupported,
        message: '지원하지 않는 교정성적서 양식입니다. 현재 HCT 양식만 처리 가능합니다.',
      });
    }

    const certificateNumber = this.matchOrThrow(
      text,
      /성적서번호\(Certificate No\)\s*:\s*([A-Za-z]+-\d{4}-\d+(?:-R\d+)?)/,
      '성적서번호'
    );

    const managementNumber = this.matchOrThrow(
      text,
      /고객사 관리번호\s*\(Asset ID\)\s*:\s*(\S+)/,
      '고객사 관리번호'
    );

    const calibrationDate = this.parseKoreanDateOrThrow(
      text,
      /교정일자\s*\(Date of calibration\)\s*:\s*(\d{4})\.(\d{2})\.(\d{2})/,
      '교정일자'
    );

    // 차기교정예정일자는 KOLAS-G-008 비대상 장비(안테나 등)에서 누락 가능
    const nextCalibrationDate = this.parseKoreanDate(
      text,
      /차기교정예정일자\s*\(The due date of next Cal\.\)\s*:\s*(\d{4})\.(\d{2})\.(\d{2})/
    );

    const { revisionNumber, parentCertificateNumber } = this.parseRevisionInfo(
      text,
      certificateNumber
    );

    const result: ExtractedCalibrationCertificate = {
      managementNumber,
      certificateNumber,
      revisionNumber,
      parentCertificateNumber,
      calibrationDate,
      nextCalibrationDate,
      agencyName: 'HCT',
    };

    // SSOT Zod 검증 — 추출 결과가 schema 계약을 만족하는지 자체 검증
    return extractedCalibrationCertificateSchema.parse(result);
  }

  private matchOrThrow(text: string, pattern: RegExp, fieldLabel: string): string {
    const match = text.match(pattern);
    if (!match || !match[1]) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateFieldMissing,
        message: `교정성적서에서 '${fieldLabel}'을(를) 찾을 수 없습니다. PDF 양식을 확인해 주세요.`,
        details: { field: fieldLabel },
      });
    }
    return match[1].trim();
  }

  private parseKoreanDateOrThrow(text: string, pattern: RegExp, fieldLabel: string): string {
    const result = this.parseKoreanDate(text, pattern);
    if (!result) {
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateFieldMissing,
        message: `교정성적서에서 '${fieldLabel}'을(를) 찾을 수 없습니다. PDF 양식을 확인해 주세요.`,
        details: { field: fieldLabel },
      });
    }
    return result;
  }

  private parseKoreanDate(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    if (!match) return null;
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }

  /**
   * 수정 성적서(`-R{n}`) 추출.
   * - certificateNumber 자체에 R suffix → revisionNumber = n + 1 (R1=2, R2=3...)
   * - 본문에 *"이 성적서는 제'<번호>'호의 수정 성적서"* 문구 → parentCertificateNumber 명시 추출
   * - documents.revisionNumber 컨벤션과 일치 (1=original, 2=first revision)
   */
  private parseRevisionInfo(
    text: string,
    certificateNumber: string
  ): { revisionNumber: number; parentCertificateNumber: string | null } {
    const suffixMatch = certificateNumber.match(/-R(\d+)$/);
    if (!suffixMatch) {
      return { revisionNumber: 1, parentCertificateNumber: null };
    }

    const revisionIndex = Number.parseInt(suffixMatch[1], 10);
    const parentMatch = text.match(/이 성적서는 제\s*['']([^'']+)['']호의 수정 성적서/);

    return {
      revisionNumber: revisionIndex + 1,
      parentCertificateNumber: parentMatch ? parentMatch[1].trim() : null,
    };
  }

  private async runPdfToText(pdfBuffer: Buffer): Promise<string> {
    const tempPath = path.join(os.tmpdir(), `cal-cert-${generateOpaqueId()}.pdf`);
    try {
      await fs.writeFile(tempPath, pdfBuffer);
      // 보안 — maxBuffer: zip-bomb 방어 (10MB), timeout: 악의적 PDF 무한 루프 방어 (15s).
      const { stdout } = await execFileAsync('pdftotext', ['-layout', tempPath, '-'], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 15_000,
      });
      return stdout;
    } catch (err) {
      this.logger.error(
        'pdftotext 실행 실패 (timeout/binary missing/PDF corrupted)',
        err instanceof Error ? err.stack : String(err)
      );
      throw new BadRequestException({
        code: ErrorCode.CalibrationCertificateExtractionFailed,
        message: 'PDF 텍스트 추출에 실패했습니다. 파일이 손상되었거나 처리 시간이 초과되었습니다.',
      });
    } finally {
      await fs.unlink(tempPath).catch(() => undefined);
    }
  }
}
