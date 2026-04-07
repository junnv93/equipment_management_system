/**
 * Form Templates seed data
 *
 * 글로벌 시드에 양식 템플릿 행을 미리 채워 E2E 테스트가 매번 자체 시드를 만들지 않게 한다.
 * - 목록(GET /api/form-templates) 조회 어설션이 fresh DB에서도 통과
 * - history?formName=... 가 빈 결과를 반환하지 않음
 *
 * 주의: storageKey는 placeholder. 다운로드 테스트는 TC-02 업로드로 생성한 row(다른 formName)를
 * 사용하므로 이 시드는 storage 파일이 없어도 됩니다. 다른 formName을 사용해 충돌 방지.
 */

import { formTemplates } from '@equipment-management/db/schema';

export const FORM_TEMPLATES_SEED_DATA: (typeof formTemplates.$inferInsert)[] = [
  {
    formName: '시험설비 관리대장',
    formNumber: 'UL-QP-18-01',
    storageKey: 'seed/form-templates/UL-QP-18-01.docx',
    originalFilename: 'UL-QP-18-01_시험설비_관리대장.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1024,
    isCurrent: true,
  },
  {
    formName: '시험설비 이력카드',
    formNumber: 'UL-QP-18-02',
    storageKey: 'seed/form-templates/UL-QP-18-02.docx',
    originalFilename: 'UL-QP-18-02_시험설비_이력카드.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1024,
    isCurrent: true,
  },
];
