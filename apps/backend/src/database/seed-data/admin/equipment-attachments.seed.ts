/**
 * Equipment Attachments seed data
 * 6 attachments: inspection_report (2), history_card (2), other (2)
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

export const EQUIPMENT_ATTACHMENTS_SEED_DATA: (typeof equipmentAttachments.$inferInsert)[] = [
  // inspection_report
  {
    id: ATTACH_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    requestId: null,
    attachmentType: 'inspection_report',
    fileName: 'inspection-spectrum-analyzer-2025.pdf',
    originalFileName: '스펙트럼분석기_검수보고서_2025.pdf',
    filePath: '/uploads/2025/01/inspection-spectrum-analyzer-2025.pdf',
    fileSize: 1_245_678,
    mimeType: 'application/pdf',
    description: '신규 입고 검수보고서 — 외관, 기본 기능, 부속품 확인',
    uploadedAt: daysAgo(90),
  },
  {
    id: ATTACH_002_ID,
    equipmentId: null,
    requestId: EQUIP_REQ_002_ID,
    attachmentType: 'inspection_report',
    fileName: 'inspection-power-meter-uiw.pdf',
    originalFileName: '디지털파워미터_검수보고서.pdf',
    filePath: '/uploads/2026/02/inspection-power-meter-uiw.pdf',
    fileSize: 892_340,
    mimeType: 'application/pdf',
    description: '의왕 신규 장비 등록 요청 첨부',
    uploadedAt: daysAgo(14),
  },

  // history_card
  {
    id: ATTACH_003_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    requestId: null,
    attachmentType: 'history_card',
    fileName: 'history-card-signal-gen.pdf',
    originalFileName: '시험설비이력카드_신호발생기.pdf',
    filePath: '/uploads/2025/03/history-card-signal-gen.pdf',
    fileSize: 2_156_890,
    mimeType: 'application/pdf',
    description: 'UL-QP-18-02 시험설비이력카드',
    uploadedAt: daysAgo(120),
  },
  {
    id: ATTACH_004_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    requestId: null,
    attachmentType: 'history_card',
    fileName: 'history-card-network-analyzer.pdf',
    originalFileName: '시험설비이력카드_네트워크분석기.pdf',
    filePath: '/uploads/2025/06/history-card-network-analyzer.pdf',
    fileSize: 1_890_456,
    mimeType: 'application/pdf',
    description: 'UL-QP-18-02 시험설비이력카드',
    uploadedAt: daysAgo(150),
  },

  // other
  {
    id: ATTACH_005_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    requestId: EQUIP_REQ_001_ID,
    attachmentType: 'other',
    fileName: 'calibration-cert-spectrum-2025.pdf',
    originalFileName: '교정성적서_스펙트럼분석기_2025.pdf',
    filePath: '/uploads/2025/12/calibration-cert-spectrum-2025.pdf',
    fileSize: 3_456_789,
    mimeType: 'application/pdf',
    description: 'KOLAS 공인 교정성적서',
    uploadedAt: daysAgo(30),
  },
  {
    id: ATTACH_006_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    requestId: null,
    attachmentType: 'other',
    fileName: 'repair-photo-receiver.jpg',
    originalFileName: 'RF수신기_수리사진.jpg',
    filePath: '/uploads/2026/02/repair-photo-receiver.jpg',
    fileSize: 4_567_890,
    mimeType: 'image/jpeg',
    description: 'RF 앰프 모듈 교체 전후 사진',
    uploadedAt: daysAgo(4),
  },
];
