/**
 * Equipment Documents seed data — documents 테이블 직접 시드.
 *
 * equipment_attachments.attachment_type enum은 ['inspection_report', 'history_card', 'other']만 지원하여
 * 이력카드(UL-QP-18-02) 출력에 필요한 `equipment_photo` 타입은 sync 경로로 들어오지 않는다.
 *
 * **경로 형식 주의** (local-storage.provider.ts:89-97 참조):
 * - 절대경로(`/uploads/...`)는 path traversal 차단 로직에 걸려 다운로드 실패 → **사용 금지**
 * - **권장**: `{category}/{filename}` 상대경로 (예: `equipment_photos/suw-e0001.jpg`) — uploadDir 내부로 해석
 *
 * 실제 파일이 없으면 LocalStorageProvider.download가 ENOENT throw:
 * - 이력카드 렌더러는 graceful skip (renderer.service.injectEquipmentPhoto의 try/catch)
 * - 프론트 "문서 다운로드" 버튼은 400 에러 발생
 * → 개발 환경에서는 seed-test-new.ts가 `ensureSeedPlaceholderImages()` 로 placeholder JPEG 자동 생성
 *
 * 현재 대상 장비:
 * - SUW-E0001 (스펙트럼 분석기) — 모든 이력카드 필드가 채워진 reference 장비
 */

import { documents } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  USER_LAB_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

const DOCUMENT_SUW_E0001_PHOTO_ID = 'dcdc0001-0001-0001-0001-000000000001';

/**
 * SUW-E0001 placeholder 사진 경로 — uploadDir 내부 상대경로.
 * `ensureSeedPlaceholderImages()` 가 이 경로에 800×600 회색 JPEG를 자동 생성한다.
 */
export const SEED_PLACEHOLDER_PHOTO_PATH =
  'equipment_photos/suw-e0001-spectrum-analyzer-front.jpg' as const;

export const EQUIPMENT_DOCUMENTS_SEED_DATA: (typeof documents.$inferInsert)[] = [
  // SUW-E0001 장비 사진 (이력카드 "장비 사진" 셀 검증용)
  {
    id: DOCUMENT_SUW_E0001_PHOTO_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    documentType: 'equipment_photo',
    status: 'active',
    fileName: 'spectrum-analyzer-front.jpg',
    originalFileName: '스펙트럼분석기_전면.jpg',
    filePath: SEED_PLACEHOLDER_PHOTO_PATH,
    fileSize: 0, // placeholder 생성 후 실제 크기로 갱신될 수 있으나 이력카드 렌더링에 영향 없음
    mimeType: 'image/jpeg',
    description: 'SUW-E0001 장비 전면 사진 (이력카드 §6) — 개발용 placeholder',
    revisionNumber: 1,
    isLatest: true,
    uploadedAt: daysAgo(90),
    uploadedBy: USER_LAB_MANAGER_SUWON_ID,
  },
];
