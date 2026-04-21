/**
 * Equipment Attachments seed data
 * 6 attachments: inspection_report (2), history_card (2), other (2)
 *
 * **경로 형식 주의** (local-storage.provider.ts 참조):
 * - 절대경로(`/uploads/...`)는 path traversal 차단 → **사용 금지**
 * - **권장**: `{category}/{filename}` 상대경로 — uploadDir 내부로 해석
 * - 실제 파일: seed-test-new.ts `ensureSeedPlaceholderAttachments()`가 자동 생성
 */

import { equipmentAttachments } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  ATTACH_001_ID,
  ATTACH_002_ID,
  ATTACH_003_ID,
  ATTACH_004_ID,
  ATTACH_005_ID,
  ATTACH_006_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_REQ_001_ID,
  EQUIP_REQ_002_ID,
} from '../../utils/uuid-constants';

/**
 * Placeholder 파일 경로 목록 — uploadDir 상대경로.
 * seed-test-new.ts의 ensureSeedPlaceholderAttachments()가 이 경로들에 파일을 자동 생성.
 */
export const SEED_PLACEHOLDER_ATTACHMENT_PATHS = [
  'inspection_reports/inspection-spectrum-analyzer-2025.pdf',
  'inspection_reports/inspection-power-meter-uiw.pdf',
  'history_cards/history-card-signal-gen.pdf',
  'history_cards/history-card-network-analyzer.pdf',
  'other/calibration-cert-spectrum-2025.pdf',
  'other/repair-photo-receiver.jpg',
] as const;

export const EQUIPMENT_ATTACHMENTS_SEED_DATA: (typeof equipmentAttachments.$inferInsert)[] = [
  // inspection_report — 신규 입고 검수보고서
  {
    id: ATTACH_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    requestId: null,
    attachmentType: 'inspection_report',
    fileName: 'inspection-spectrum-analyzer-2025.pdf',
    originalFileName: '스펙트럼분석기_검수보고서_2025.pdf',
    filePath: 'inspection_reports/inspection-spectrum-analyzer-2025.pdf',
    fileSize: 1_245_678,
    mimeType: 'application/pdf',
    description: '신규 입고 검수보고서 — 외관, 기본 기능, 부속품 확인',
    uploadedAt: daysAgo(90),
  },
  // inspection_report — 장비 등록 요청 첨부
  {
    id: ATTACH_002_ID,
    equipmentId: null,
    requestId: EQUIP_REQ_002_ID,
    attachmentType: 'inspection_report',
    fileName: 'inspection-power-meter-uiw.pdf',
    originalFileName: '디지털파워미터_검수보고서.pdf',
    filePath: 'inspection_reports/inspection-power-meter-uiw.pdf',
    fileSize: 892_340,
    mimeType: 'application/pdf',
    description: '의왕 신규 장비 등록 요청 첨부',
    uploadedAt: daysAgo(14),
  },

  // history_card — UL-QP-18-02 시험설비이력카드
  {
    id: ATTACH_003_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    requestId: null,
    attachmentType: 'history_card',
    fileName: 'history-card-signal-gen.pdf',
    originalFileName: '시험설비이력카드_신호발생기.pdf',
    filePath: 'history_cards/history-card-signal-gen.pdf',
    fileSize: 2_156_890,
    mimeType: 'application/pdf',
    description: 'UL-QP-18-02 시험설비이력카드',
    uploadedAt: daysAgo(120),
  },
  // history_card — UL-QP-18-02 시험설비이력카드
  {
    id: ATTACH_004_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    requestId: null,
    attachmentType: 'history_card',
    fileName: 'history-card-network-analyzer.pdf',
    originalFileName: '시험설비이력카드_네트워크분석기.pdf',
    filePath: 'history_cards/history-card-network-analyzer.pdf',
    fileSize: 1_890_456,
    mimeType: 'application/pdf',
    description: 'UL-QP-18-02 시험설비이력카드',
    uploadedAt: daysAgo(150),
  },

  // other — KOLAS 공인 교정성적서
  {
    id: ATTACH_005_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    requestId: EQUIP_REQ_001_ID,
    attachmentType: 'other',
    fileName: 'calibration-cert-spectrum-2025.pdf',
    originalFileName: '교정성적서_스펙트럼분석기_2025.pdf',
    filePath: 'other/calibration-cert-spectrum-2025.pdf',
    fileSize: 3_456_789,
    mimeType: 'application/pdf',
    description: 'KOLAS 공인 교정성적서',
    uploadedAt: daysAgo(30),
  },
  // other — 수리 전후 사진
  {
    id: ATTACH_006_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    requestId: null,
    attachmentType: 'other',
    fileName: 'repair-photo-receiver.jpg',
    originalFileName: 'RF수신기_수리사진.jpg',
    filePath: 'other/repair-photo-receiver.jpg',
    fileSize: 4_567_890,
    mimeType: 'image/jpeg',
    description: 'RF 앰프 모듈 교체 전후 사진',
    uploadedAt: daysAgo(4),
  },
];
