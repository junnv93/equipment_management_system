# 빠른 시작 프롬프트 모음

각 프롬프트를 복사하여 새 대화에서 바로 사용하세요.

---

## 프롬프트 1: 사용자 역할 시스템 개선

```
AGENTS.md와 API_STANDARDS.md를 참조하여 사용자 역할 시스템을 개선해줘.

요구사항:
- 역할 변경: USER → 시험실무자(TEST_OPERATOR), MANAGER → 기술책임자(TECHNICAL_MANAGER), ADMIN → 시험소별 관리자(SITE_ADMIN)
- 사용자 테이블에 사이트 정보 추가 (site: 'suwon' | 'uiwang')
- 사용자 테이블에 시험소 위치 정보 추가 (location: '수원랩' | '의왕랩')
- Azure AD에서 팀 정보 자동 매핑 (LST.SUW.RF → RF팀+수원랩, LST.SUW.SAR → SAR팀+수원랩)
- 직위 정보 추가 (position 필드)

파일:
- packages/db/src/schema/users.ts (site, location, position 필드 추가)
- packages/schemas/src/types/user-role.enum.ts (역할 enum 수정)
- packages/schemas/src/enums.ts (UserRoleEnum 업데이트)
- apps/backend/src/modules/auth/rbac/roles.enum.ts (역할 enum 수정)
- apps/backend/src/modules/auth/rbac/role-permissions.ts (권한 재정의)
- apps/backend/src/modules/auth/auth.service.ts (Azure AD 매핑 로직 수정)
- apps/backend/drizzle/ (마이그레이션 생성)

제약사항:
- 기존 데이터 호환성 유지 (마이그레이션 스크립트 작성)
- 하위 호환성을 위한 역할 매핑 테이블 사용
- API_STANDARDS 준수
- 근본적 해결 (단편적 수정 금지)
- 중복 제거

검증:
- pnpm db:generate (마이그레이션 생성 확인)
- pnpm db:migrate (마이그레이션 테스트)
- pnpm tsc --noEmit (타입 체크)
- 기존 인증 플로우 동작 확인
- Azure AD 로그인 테스트
```

---

## 프롬프트 2: 사이트별 권한 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 사이트별 권한 관리 시스템을 구현해줘.

요구사항:
- 장비 테이블에 site 필드 추가 (site: 'suwon' | 'uiwang')
- 팀 테이블에 site 필드 추가
- 장비 등록/수정 시 사이트 지정 필수
- 조회 권한: 시험실무자는 자신의 사이트 장비만 조회 가능 (선택적, 기본은 전체 조회)
- 기술책임자/관리자는 모든 사이트 조회 가능
- 팀별 권한: EMC팀은 RF팀 장비 반출 신청/승인 불가 (같은 사이트 내에서도)
- 장비 등록 시 관리 팀 구분자 등록

파일:
- packages/db/src/schema/equipment.ts (site 필드 추가)
- packages/db/src/schema/teams.ts (site 필드 추가)
- apps/backend/src/modules/equipment/equipment.service.ts (사이트 필터링 로직)
- apps/backend/src/modules/auth/guards/permissions.guard.ts (사이트별 권한 체크)
- apps/backend/src/modules/checkouts/checkouts.service.ts (팀별 권한 체크)
- apps/backend/src/modules/rentals/rentals.service.ts (팀별 권한 체크)
- apps/backend/drizzle/ (마이그레이션 생성)

제약사항:
- 기존 장비 데이터 마이그레이션 필요 (기본값: 'suwon')
- API_STANDARDS 준수
- 근본적 해결
- 중복 제거
- 권한 체크는 가드에서 일관되게 처리

검증:
- pnpm db:migrate
- pnpm tsc --noEmit
- 권한 테스트 작성 (E2E)
- 사이트별 조회 테스트
- 팀별 권한 제한 테스트
```

---

## 프롬프트 3: 장비 등록/수정/삭제 승인 프로세스

```
AGENTS.md와 API_STANDARDS.md를 참조하여 장비 등록/수정/삭제 승인 프로세스(2단계)를 구현해줘.

요구사항:
- 장비 등록/수정/삭제는 요청 단계와 승인 단계로 분리
- 1단계: 시험실무자가 요청 제출 (상태: pending_approval)
- 2단계: 기술책임자가 승인/반려 (상태: approved/rejected)
- 파일 첨부: 이력카드(기존 장비 등록 시), 검수보고서(신규 장비 등록 시)
- 필수 필드 확장: 소프트웨어/펌웨어 버전, 장비타입, 시리얼넘버, 모델명, 검수보고서, 현재 위치, 교정일자, 교정결과, 보정계수, 차기 교정일, 중간점검일정, 장비 수리 내역
- 시스템 관리자는 직접 승인 가능 (자체 승인)

파일:
- packages/db/src/schema/equipment.ts (approval_status, requested_by, approved_by 필드 추가)
- packages/db/src/schema/equipment-requests.ts (새 테이블: 요청 이력)
- packages/db/src/schema/equipment-attachments.ts (새 테이블: 파일 첨부)
- apps/backend/src/modules/equipment/dto/create-equipment.dto.ts (필수 필드 확장, 파일 필드 추가)
- apps/backend/src/modules/equipment/dto/update-equipment.dto.ts (필수 필드 확장)
- apps/backend/src/modules/equipment/equipment.service.ts (승인 프로세스 로직)
- apps/backend/src/modules/equipment/equipment.controller.ts (승인 엔드포인트 추가)
- apps/backend/src/modules/equipment/equipment-approval.service.ts (새 서비스: 승인 처리)
- apps/frontend/app/equipment/create/page.tsx (파일 업로드 UI 추가)
- apps/frontend/app/equipment/[id]/edit/page.tsx (파일 업로드 UI 추가)
- apps/frontend/app/admin/equipment-approvals/page.tsx (승인 관리 페이지)

제약사항:
- 반려 시 사유 필수
- 파일 저장은 외부 스토리지 또는 데이터베이스 (BLOB)
- 파일 크기 제한 (예: 10MB)
- 파일 형식 제한 (PDF, 이미지 등)
- API_STANDARDS 준수
- 근본적 해결

검증:
- 승인 프로세스 E2E 테스트
- 파일 업로드 테스트
- 필수 필드 검증 테스트
- 타입 체크 통과
- 파일 크기/형식 검증 테스트
```

---

## 프롬프트 4: 교정 관리 승인 프로세스

```
AGENTS.md와 API_STANDARDS.md를 참조하여 교정 관리 승인 프로세스를 구현해줘.

요구사항:
- 기술책임자 등록: Comment 필드 필수 입력 (검토 완료 표시)
- 시험실무자 등록: 기술책임자 승인 필요 (상태: pending_approval → approved)
- 교정 기록에 등록자 역할 구분 (registeredBy, approvedBy, registeredByRole)
- 중간점검 알림 기능 추가 (교정 알림과 함께 발송)
- 중간점검일정 필드 활용 (intermediateCheckDate)

파일:
- packages/db/src/schema/calibrations.ts (approval_status, registered_by, approved_by, registered_by_role, comment 필드 추가)
- apps/backend/src/modules/calibration/calibration.service.ts (승인 로직 추가)
- apps/backend/src/modules/calibration/calibration.controller.ts (승인 엔드포인트 추가)
- apps/backend/src/modules/notifications/notifications.service.ts (중간점검 알림 로직)
- apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts (새 스케줄러)
- apps/frontend/app/calibration/register/page.tsx (등록자 역할에 따른 UI 분기)
- apps/frontend/app/admin/calibration-approvals/page.tsx (승인 관리 페이지)

제약사항:
- 기술책임자는 Comment 입력 필수
- 시험실무자 등록은 승인 대기 상태
- 중간점검 알림은 교정 알림과 통합 관리
- API_STANDARDS 준수
- 중복 제거

검증:
- 승인 프로세스 테스트
- 알림 기능 테스트
- Comment 필수 검증 테스트
- 타입 체크 통과
- 스케줄러 테스트
```

---

## 프롬프트 5: 반입 프로세스 개선

```
AGENTS.md와 API_STANDARDS.md를 참조하여 반입 프로세스를 개선해줘.

요구사항:
- 반입 시 검사 항목: 교정 여부 확인 (calibrationChecked), 수리 여부 확인 (repairChecked), 작동 여부 확인 (workingStatusChecked)
- 검사 결과 기록 (inspectionNotes)
- 기술책임자 최종 승인 필요 (상태: returned → final_approved)
- 반입 승인 후 장비 상태 자동 복원 (available)
- 반입 검사 항목은 최소 1개 이상 선택 필수

파일:
- packages/db/src/schema/checkouts.ts (finalApproverId, inspectionStatus 필드 확인 및 필요시 추가)
- apps/backend/src/modules/checkouts/dto/return-checkout.dto.ts (검사 항목 필드 확인)
- apps/backend/src/modules/checkouts/checkouts.service.ts (반입 승인 로직 추가)
- apps/backend/src/modules/checkouts/checkouts.controller.ts (반입 승인 엔드포인트 추가)
- apps/frontend/app/checkouts/manage/page.tsx (반입 검사 UI 개선)
- apps/frontend/app/admin/return-approvals/page.tsx (반입 승인 페이지 개선)

제약사항:
- 검사 항목은 최소 1개 이상 선택 필수
- 기술책임자만 최종 승인 가능
- API_STANDARDS 준수
- 기존 반입 기능과 호환성 유지
- 근본적 해결

검증:
- 반입 프로세스 E2E 테스트
- 검사 항목 검증 테스트
- 기술책임자 권한 테스트
- 타입 체크 통과
- 장비 상태 복원 테스트
```

---

## 프롬프트 6: 보정계수 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 보정계수 관리 기능을 구현해줘.

요구사항:
- 장비에 보정계수 필드 추가 (calibrationFactors: JSON 또는 별도 테이블)
- 보정계수 등록/수정 시 기술책임자 승인 필요
- 보정계수 변경 이력 자동 기록
- 보정계수 대장 자동 등록 (별도 테이블 또는 리포트)
- 보정계수는 교정 시마다 변경 가능

파일:
- packages/db/src/schema/equipment.ts (calibrationFactors 필드 추가 - JSON 또는 관계)
- packages/db/src/schema/calibration-factors.ts (새 테이블: 보정계수 이력 및 대장)
- apps/backend/src/modules/equipment/dto/update-equipment.dto.ts (보정계수 필드)
- apps/backend/src/modules/equipment/equipment.service.ts (보정계수 승인 로직)
- apps/backend/src/modules/calibration-factors/calibration-factors.module.ts (새 모듈)
- apps/backend/src/modules/calibration-factors/calibration-factors.service.ts (새 서비스)
- apps/backend/src/modules/calibration-factors/calibration-factors.controller.ts (새 컨트롤러)
- apps/frontend/app/equipment/[id]/calibration-factors/page.tsx (보정계수 관리 페이지)
- apps/frontend/app/admin/calibration-factor-approvals/page.tsx (승인 페이지)
- apps/frontend/app/reports/calibration-factors/page.tsx (보정계수 대장 페이지)

제약사항:
- 보정계수 변경 이력은 영구 보관
- 승인 전까지는 이전 보정계수 유지
- API_STANDARDS 준수
- 타입 안전성 보장
- JSON 필드 사용 시 타입 정의 필수

검증:
- 보정계수 변경 이력 테스트
- 승인 프로세스 테스트
- 보정계수 대장 조회 테스트
- 타입 체크 통과
- JSON 스키마 검증 테스트
```

---

## 프롬프트 7: 부적합 장비 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 부적합 장비 관리 기능을 구현해줘.

요구사항:
- 장비 상태에 'non_conforming' 추가
- 부적합 발견 시 장비 상태를 'non_conforming'으로 변경
- 부적합 기록 등록 (원인, 발견일, 발견자, 조치 계획)
- 원인분석/조치 기록 (분석 내용, 조치 내용, 조치일, 조치자)
- 사용 재개 승인 (기술책임자 승인 필요, 상태: non_conforming → available)
- 부적합 이력 영구 보관

파일:
- packages/db/src/schema/equipment.ts (status enum에 'non_conforming' 추가)
- packages/db/src/schema/non-conformances.ts (새 테이블: 부적합 기록)
- packages/schemas/src/enums.ts (EquipmentStatusEnum에 'non_conforming' 추가)
- apps/backend/src/modules/equipment/equipment.service.ts (부적합 처리 로직)
- apps/backend/src/modules/equipment/equipment.controller.ts (부적합 엔드포인트)
- apps/backend/src/modules/non-conformances/non-conformances.module.ts (새 모듈)
- apps/backend/src/modules/non-conformances/non-conformances.service.ts (새 서비스)
- apps/frontend/app/equipment/[id]/non-conformance/page.tsx (부적합 관리 페이지)
- apps/frontend/app/equipment/[id]/page.tsx (부적합 상태 표시)
- apps/frontend/app/admin/non-conformance-approvals/page.tsx (재개 승인 페이지)

제약사항:
- 부적합 장비는 즉시 사용 중단 (대여/반출 불가)
- 재개 승인 전까지 사용 불가
- API_STANDARDS 준수
- 이력 추적 가능
- 근본적 해결

검증:
- 부적합 프로세스 E2E 테스트
- 재개 승인 테스트
- 부적합 장비 대여/반출 차단 테스트
- 타입 체크 통과
- 이력 추적 테스트
```

---

## 프롬프트 8: 공용장비 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 공용장비(Safety lab) 관리 기능을 구현해줘.

요구사항:
- 장비에 isShared 필드 추가 (공용장비 여부)
- 공용장비는 일회성 등록 가능 (최소 정보만)
- 교정성적서 파일 첨부
- 관리기록 등록
- 공용장비는 대여/반출만 가능 (등록/수정 제한)
- 공용장비 소스 정보 (sharedSource: 'safety_lab' 등)

파일:
- packages/db/src/schema/equipment.ts (isShared, sharedSource 필드 추가)
- apps/backend/src/modules/equipment/dto/create-equipment.dto.ts (공용장비 플래그)
- apps/backend/src/modules/equipment/equipment.service.ts (공용장비 처리 로직)
- apps/backend/src/modules/equipment/equipment.controller.ts (공용장비 권한 체크)
- apps/frontend/app/equipment/create-shared/page.tsx (공용장비 등록 페이지)
- apps/frontend/app/equipment/[id]/page.tsx (공용장비 표시)

제약사항:
- 공용장비는 최소 정보만 입력 (name, managementNumber, isShared, sharedSource)
- 교정성적서는 파일로 보관
- 공용장비는 수정/삭제 불가 (읽기 전용)
- API_STANDARDS 준수
- 일반 장비와 구분

검증:
- 공용장비 등록 테스트
- 파일 첨부 테스트
- 공용장비 수정/삭제 차단 테스트
- 타입 체크 통과
```

---

## 프롬프트 9: 소프트웨어 관리대장

```
AGENTS.md와 API_STANDARDS.md를 참조하여 소프트웨어 관리대장 기능을 구현해줘.

요구사항:
- 장비에 software 필드 확장 (현재 softwareVersion만 있음, softwareName, softwareVersion, softwareType 추가)
- Software 등록/변경 시 검증 기록 보관
- Software 변경 History 테이블 (변경일, 변경자, 변경 전/후 버전, 검증 기록)
- Software 통합 관리대장 (모든 장비의 Software 현황)
- Software별 장비 목록 조회
- Software 변경 시 기술책임자 승인 필요

파일:
- packages/db/src/schema/equipment.ts (software 필드 확장)
- packages/db/src/schema/software-history.ts (새 테이블: Software 변경 이력)
- packages/db/src/schema/software-registry.ts (새 테이블: Software 통합 대장)
- apps/backend/src/modules/equipment/equipment.service.ts (Software 변경 로직)
- apps/backend/src/modules/software/software.module.ts (새 모듈)
- apps/backend/src/modules/software/software.service.ts (새 서비스)
- apps/backend/src/modules/software/software.controller.ts (새 컨트롤러)
- apps/frontend/app/software/page.tsx (Software 관리대장 페이지)
- apps/frontend/app/equipment/[id]/software/page.tsx (장비별 Software 이력)
- apps/frontend/app/admin/software-approvals/page.tsx (Software 변경 승인 페이지)

제약사항:
- Software 변경 시 검증 기록 필수
- 변경 이력 영구 보관
- API_STANDARDS 준수
- 타입 안전성 보장
- 근본적 해결

검증:
- Software 변경 이력 테스트
- 통합 대장 조회 테스트
- 검증 기록 필수 테스트
- 타입 체크 통과
```

---

## 프롬프트 10: 교정계획서

```
AGENTS.md와 API_STANDARDS.md를 참조하여 교정계획서 기능을 구현해줘.

요구사항:
- 연간 교정계획서 작성 (해당 연도 교정 대상 장비 목록)
- 기술책임자가 계획서 작성
- 시험소장 승인 프로세스 (상태: draft → pending_approval → approved)
- 계획서 출력 기능 (PDF)
- 계획서 이력 관리
- 계획서에 포함된 장비 목록 관리

파일:
- packages/db/src/schema/calibration-plans.ts (새 테이블: 교정계획서)
- packages/db/src/schema/calibration-plan-items.ts (새 테이블: 계획서 항목)
- apps/backend/src/modules/calibration/calibration-plan.service.ts (새 서비스)
- apps/backend/src/modules/calibration/calibration-plan.controller.ts (새 컨트롤러)
- apps/frontend/app/calibration/plan/create/page.tsx (계획서 작성 페이지)
- apps/frontend/app/admin/calibration-plan-approvals/page.tsx (시험소장 승인 페이지)
- apps/frontend/app/calibration/plan/[id]/export/page.tsx (PDF 출력)
- apps/frontend/lib/utils/pdf-generator.ts (PDF 생성 유틸리티)

제약사항:
- 연도별 계획서 관리
- 시험소장 승인 필수
- PDF 출력 기능 (react-pdf 또는 서버 사이드)
- API_STANDARDS 준수
- 근본적 해결

검증:
- 계획서 작성/승인 프로세스 테스트
- PDF 출력 테스트
- 계획서 이력 조회 테스트
- 타입 체크 통과
```

---

## 프롬프트 11: 중간점검 알림

```
AGENTS.md와 API_STANDARDS.md를 참조하여 중간점검 알림 기능을 구현해줘.

요구사항:
- 장비에 중간점검일정 필드 활용 (needsIntermediateCheck, intermediateCheckDate)
- 교정 알림과 함께 중간점검 알림 발송
- 알림 대상: 해당 팀의 시험실무자와 기술책임자
- 알림 주기: 중간점검일정 D-30일, D-7일, 당일
- 중간점검 완료 시 알림 해제

파일:
- apps/backend/src/modules/notifications/notifications.service.ts (중간점검 알림 로직)
- apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts (새 스케줄러)
- apps/backend/src/modules/notifications/schedulers/calibration-scheduler.ts (기존 스케줄러와 통합)
- apps/frontend/components/notifications/IntermediateCheckAlert.tsx (알림 컴포넌트)
- apps/frontend/app/calibration/page.tsx (중간점검 목록 표시)

제약사항:
- 교정 알림과 통합 관리
- 스케줄러는 cron job 또는 queue 사용 (BullMQ, node-cron 등)
- API_STANDARDS 준수
- 중복 알림 방지
- 근본적 해결

검증:
- 알림 발송 테스트
- 스케줄러 테스트
- 중복 알림 방지 테스트
- 타입 체크 통과
```

---

## 프롬프트 12: 데이터 보관 및 백업 정책

```
AGENTS.md를 참조하여 데이터 보관 및 백업 정책을 구현해줘.

요구사항:
- 5년 보관 정책 구현 (자동 아카이빙)
- 데이터 용량 모니터링
- 백업 주기 설정 (일일/주간/월간)
- 백업본 관리 (로컬/원격)
- 백업 복원 프로세스
- 아카이빙된 데이터 조회 기능

파일:
- apps/backend/src/modules/archive/archive.service.ts (새 서비스)
- apps/backend/src/modules/backup/backup.service.ts (새 서비스)
- apps/backend/src/modules/monitoring/storage.monitor.ts (용량 모니터링)
- scripts/backup.sh (백업 스크립트)
- scripts/restore.sh (복원 스크립트)
- scripts/archive.sh (아카이빙 스크립트)
- apps/backend/src/modules/archive/archive.controller.ts (아카이빙 데이터 조회)

제약사항:
- 5년 초과 데이터는 자동 아카이빙
- 백업은 암호화 저장
- API_STANDARDS 준수
- 복원 프로세스 문서화
- 근본적 해결

검증:
- 아카이빙 프로세스 테스트
- 백업/복원 테스트
- 용량 모니터링 테스트
- 암호화 검증 테스트
```

---

## 프롬프트 13: 장비 필수 필드 확장

```
AGENTS.md와 API_STANDARDS.md를 참조하여 장비 등록 시 필수 필드를 확장해줘.

요구사항:
- 필수 필드 추가: 소프트웨어 버전, 펌웨어 버전, 장비타입, 시리얼넘버, 모델명, 검수보고서, 현재 위치, 교정일자, 교정결과, 보정계수, 차기 교정일, 중간점검일정, 장비 수리 내역
- 기존 필드 중 필수로 변경: 모델명, 시리얼넘버, 제조사
- 검수보고서는 파일 첨부
- 장비 수리 내역은 별도 테이블로 관리 (이력)

파일:
- packages/db/src/schema/equipment.ts (필수 필드 추가)
- packages/db/src/schema/repair-history.ts (새 테이블: 수리 이력)
- packages/schemas/src/equipment.ts (필수 필드 스키마 수정)
- apps/backend/src/modules/equipment/dto/create-equipment.dto.ts (필수 필드 추가)
- apps/frontend/components/equipment/EquipmentForm.tsx (필수 필드 UI)
- apps/frontend/app/equipment/[id]/repair-history/page.tsx (수리 이력 페이지)

제약사항:
- 기존 데이터 마이그레이션 필요 (기본값 설정)
- API_STANDARDS 준수
- 근본적 해결
- 타입 안전성 보장

검증:
- 필수 필드 검증 테스트
- 마이그레이션 테스트
- 타입 체크 통과
```

---

## 프롬프트 14: 감사 로그 시스템

```
AGENTS.md와 API_STANDARDS.md를 참조하여 감사 로그 시스템을 구현해줘.

요구사항:
- 모든 변경 사항 자동 기록 (언제, 누가, 어떤 작업을, 어떤 장비/요청에 대해, 어떻게 변경)
- 로그 형식: "2025년 5월 09일 09:30, 홍석환(기술책임자)이 '네트워크 분석기(SUW-E0326)' 신규 등록 요청(요청 ID: REQ-124, 요청자: 권명준)을 '승인'함."
- 로그 조회 기능 (필터링, 검색)
- 로그 보관 (5년)

파일:
- packages/db/src/schema/audit-logs.ts (새 테이블: 감사 로그)
- apps/backend/src/common/interceptors/audit.interceptor.ts (새 인터셉터)
- apps/backend/src/modules/audit/audit.module.ts (새 모듈)
- apps/backend/src/modules/audit/audit.service.ts (새 서비스)
- apps/backend/src/modules/audit/audit.controller.ts (새 컨트롤러)
- apps/frontend/app/admin/audit-logs/page.tsx (감사 로그 조회 페이지)

제약사항:
- 모든 중요한 작업에 로그 기록
- 로그는 수정 불가 (읽기 전용)
- API_STANDARDS 준수
- 성능 영향 최소화
- 근본적 해결

검증:
- 로그 기록 테스트
- 로그 조회 테스트
- 성능 테스트
- 타입 체크 통과
```

---

## 구현 순서 권장사항

### 1단계: 인프라 (필수) - 즉시 시작

1. 프롬프트 1: 사용자 역할 시스템 개선
2. 프롬프트 2: 사이트별 권한 관리

### 2단계: 승인 프로세스 (핵심)

3. 프롬프트 3: 장비 등록/수정/삭제 승인 프로세스
4. 프롬프트 4: 교정 관리 승인 프로세스
5. 프롬프트 5: 반입 프로세스 개선

### 3단계: 고급 기능

6. 프롬프트 6: 보정계수 관리
7. 프롬프트 7: 부적합 장비 관리
8. 프롬프트 11: 중간점검 알림

### 4단계: 관리 기능

9. 프롬프트 8: 공용장비 관리
10. 프롬프트 9: 소프트웨어 관리대장
11. 프롬프트 10: 교정계획서

### 5단계: 데이터 관리

12. 프롬프트 12: 데이터 보관 및 백업 정책
13. 프롬프트 14: 감사 로그 시스템

---

End of QUICK_START_PROMPTS.md
