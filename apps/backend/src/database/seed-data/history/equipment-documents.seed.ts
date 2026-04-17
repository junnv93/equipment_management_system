/**
 * Equipment Documents seed data — documents 테이블 직접 시드.
 *
 * equipment_attachments의 attachment_type enum은 ['inspection_report', 'history_card', 'other']만 지원하여
 * 이력카드(UL-QP-18-02) 출력에 필요한 `equipment_photo` 타입은 sync 경로로 들어오지 않는다.
 *
 * 이 시드는 **UL-QP-18-02 이력카드 "장비 사진" 셀**을 채우기 위한 최소 데이터만 포함한다.
 * 실제 파일은 mock 경로이며 저장소(SimpleStorageService)가 실패 시 이력카드는 해당 셀을 graceful skip.
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

export const EQUIPMENT_DOCUMENTS_SEED_DATA: (typeof documents.$inferInsert)[] = [
  // SUW-E0001 장비 사진 (이력카드 "장비 사진" 셀 검증용)
  {
    id: DOCUMENT_SUW_E0001_PHOTO_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    documentType: 'equipment_photo',
    status: 'active',
    fileName: 'spectrum-analyzer-front.jpg',
    originalFileName: '스펙트럼분석기_전면.jpg',
    filePath: '/uploads/2025/01/spectrum-analyzer-front.jpg',
    fileSize: 2_345_678,
    mimeType: 'image/jpeg',
    description: 'SUW-E0001 장비 전면 사진 (이력카드 §6)',
    revisionNumber: 1,
    isLatest: true,
    uploadedAt: daysAgo(90),
    uploadedBy: USER_LAB_MANAGER_SUWON_ID,
  },
];
