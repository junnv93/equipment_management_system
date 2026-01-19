# 구현 로드맵 및 프롬프트 가이드

현재 구현 상태 분석 및 미구현 기능별 프롬프트 모음.

---

## 현재 구현 상태

### 구현 완료

1. 기본 인증 시스템

   - Azure AD 통합
   - JWT 기반 인증
   - 기본 역할: USER, MANAGER, ADMIN
   - 권한 기반 접근 제어 (RBAC)

2. 장비 관리 (기본)

   - CRUD 기능 (직접 등록/수정/삭제, 승인 프로세스 없음)
   - 검색 및 필터링
   - 상태 관리
   - 기본 필드만 포함 (필수 필드 확장 필요)

3. 대여 관리

   - 대여 신청/승인/반려
   - 1단계 승인 프로세스
   - 반려 사유 필수
   - 장비 소유 팀의 담당자/매니저 승인

4. 반출 관리

   - 내부 목적 반출 (1단계 승인)
   - 외부 대여 목적 반출 (2단계 승인)
   - 기본 반입 처리 (검사 항목 포함, 최종 승인 없음)

5. 교정 관리 (기본)

   - 교정 기록 등록 (승인 프로세스 없음)
   - 교정 일정 조회
   - 교정 알림 (중간점검 알림 없음)

6. **장비 등록/수정/삭제 승인 프로세스 (프롬프트 3)** - 2026-01-19 완료
   - 2단계 승인 (요청 → 기술책임자 승인)
   - 파일 첨부 (이력카드, 검수보고서)
   - 필수 필드 확장 (소프트웨어/펌웨어 버전, 장비타입 등)
   - E2E 테스트 완료 (13/14 통과)

### 부분 구현

1. 반입 프로세스

   - 검사 항목 기록 가능
   - 기술책임자 최종 승인 없음

2. 알림 시스템
   - 교정 알림 있음
   - 중간점검 알림 없음

---

## 미구현 기능 및 우선순위

### Phase 1: 핵심 인프라 (최우선) - 즉시 시작

#### 1.1 사용자 역할 시스템 개선

- 현재: USER, MANAGER, ADMIN
- 변경: 시험실무자(TEST_OPERATOR), 기술책임자(TECHNICAL_MANAGER), 시험소별 관리자(SITE_ADMIN)
- 사이트 정보 추가 (site: 'suwon' | 'uiwang')
- 시험소 위치 정보 추가 (location: '수원랩' | '의왕랩')
- Azure AD 팀 정보 자동 매핑 (LST.SUW.RF → RF팀+수원랩)

#### 1.2 사이트별 권한 관리

- 장비 등록 시 사이트 지정 필수
- 사이트별 조회 권한 (선택적, 기본은 전체 조회)
- 팀별 권한 제한 (EMC팀은 RF팀 장비 반출 신청/승인 불가)

### Phase 2: 승인 프로세스 (고우선)

#### 2.1 장비 등록/수정/삭제 승인 프로세스

- 2단계 승인 (요청 → 기술책임자 승인)
- 파일 첨부 (이력카드, 검수보고서)
- 필수 필드 확장

#### 2.2 교정 관리 승인 프로세스

- 기술책임자 등록: Comment 입력
- 시험실무자 등록: 기술책임자 승인 필요
- 중간점검 알림

#### 2.3 반입 프로세스 개선

- 반입 시 검사 항목 (교정/수리/작동 여부)
- 기술책임자 최종 승인

### Phase 3: 고급 기능 (중우선)

#### 3.1 보정계수 관리

- 보정계수 등록/수정
- 기술책임자 승인
- 보정계수 대장 자동 등록

#### 3.2 부적합 장비 관리

- 부적합 발견 시 사용 중단
- 원인분석/조치 기록
- 사용 재개 승인

#### 3.3 공용장비 관리

- Safety lab 장비 등록
- 일회성 교정성적서/관리기록 등록

### Phase 4: 관리 기능 (중우선)

#### 4.1 소프트웨어 관리대장

- Software 등록/변경
- 검증 기록 보관
- Software 변경 History
- Software 통합 관리대장

#### 4.2 교정계획서

- 연간 교정계획서 작성
- 시험소장 승인 프로세스
- 교정대상 장비 출력

### Phase 5: 데이터 관리 (저우선)

#### 5.1 데이터 보관 정책

- 5년 보관 정책
- 용량 관리

#### 5.2 데이터 백업

- 백업 주기 설정
- 백업본 관리 방법

---

## 기능별 프롬프트

### 프롬프트 1: 사용자 역할 시스템 개선

```
AGENTS.md와 API_STANDARDS.md를 참조하여 사용자 역할 시스템을 개선해줘.

요구사항:
- 역할 변경: USER → 시험실무자(TEST_OPERATOR), MANAGER → 기술책임자(TECHNICAL_MANAGER), ADMIN → 시험소별 관리자(SITE_ADMIN)
- 사용자 테이블에 사이트 정보 추가 (site: 'suwon' | 'uiwang')
- Azure AD에서 팀 정보 자동 매핑 (LST.SUW.RF, LST.SUW.SAR 등)
- 시험소 위치 정보 추가 (location: '수원랩' | '의왕랩')

파일:
- packages/db/src/schema/users.ts (스키마 수정)
- packages/schemas/src/types/user-role.enum.ts (역할 enum 수정)
- apps/backend/src/modules/auth/rbac/roles.enum.ts
- apps/backend/src/modules/auth/rbac/role-permissions.ts (권한 재정의)
- apps/backend/src/modules/auth/auth.service.ts (Azure AD 매핑 로직)
- apps/backend/drizzle/ (마이그레이션 생성)

제약사항:
- 기존 데이터 호환성 유지
- 하위 호환성을 위한 마이그레이션 전략 수립
- API_STANDARDS 준수
- 근본적 해결 (단편적 수정 금지)

검증:
- pnpm db:migrate (마이그레이션 테스트)
- pnpm tsc --noEmit (타입 체크)
- 기존 인증 플로우 동작 확인
```

### 프롬프트 2: 사이트별 권한 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 사이트별 권한 관리 시스템을 구현해줘.

요구사항:
- 장비 테이블에 site 필드 추가 (site: 'suwon' | 'uiwang')
- 장비 등록/수정 시 사이트 지정 필수
- 조회 권한: 시험실무자는 자신의 사이트 장비만 조회 가능 (선택적)
- 기술책임자/관리자는 모든 사이트 조회 가능
- 팀별 권한: EMC팀은 RF팀 장비 반출 신청/승인 불가

파일:
- packages/db/src/schema/equipment.ts (site 필드 추가)
- packages/db/src/schema/teams.ts (site 필드 추가)
- apps/backend/src/modules/equipment/equipment.service.ts (사이트 필터링)
- apps/backend/src/modules/auth/guards/permissions.guard.ts (사이트별 권한 체크)
- apps/backend/src/modules/checkouts/checkouts.service.ts (팀별 권한 체크)

제약사항:
- 기존 장비 데이터 마이그레이션 필요
- API_STANDARDS 준수
- 근본적 해결
- 중복 제거

검증:
- pnpm db:migrate
- 타입 체크 통과
- 권한 테스트 작성
```

### 프롬프트 3: 장비 등록/수정/삭제 승인 프로세스

```
AGENTS.md와 API_STANDARDS.md를 참조하여 장비 등록/수정/삭제 승인 프로세스(2단계)를 구현해줘.

요구사항:
- 장비 등록/수정/삭제는 요청 단계와 승인 단계로 분리
- 1단계: 시험실무자가 요청 제출 (상태: pending_approval)
- 2단계: 기술책임자가 승인/반려 (상태: approved/rejected)
- 파일 첨부: 이력카드(기존 장비), 검수보고서(신규 장비)
- 필수 필드 확장: 소프트웨어/펌웨어 버전, 장비타입, 시리얼넘버, 모델명, 검수보고서, 현재 위치, 교정일자, 교정결과, 보정계수, 차기 교정일, 중간점검일정, 장비 수리 내역

파일:
- packages/db/src/schema/equipment.ts (approval_status, requested_by, approved_by 필드 추가)
- packages/db/src/schema/equipment-requests.ts (새 테이블: 요청 이력)
- packages/db/src/schema/equipment-attachments.ts (새 테이블: 파일 첨부)
- apps/backend/src/modules/equipment/dto/create-equipment.dto.ts (필수 필드 확장)
- apps/backend/src/modules/equipment/equipment.service.ts (승인 프로세스)
- apps/backend/src/modules/equipment/equipment.controller.ts (승인 엔드포인트)
- apps/frontend/app/equipment/create/page.tsx (파일 업로드 UI)
- apps/frontend/app/admin/equipment-approvals/page.tsx (승인 관리 페이지)

제약사항:
- 시스템 관리자는 직접 승인 가능 (자체 승인)
- 반려 시 사유 필수
- API_STANDARDS 준수
- 파일 저장은 외부 스토리지 또는 데이터베이스 (BLOB)

검증:
- 승인 프로세스 E2E 테스트
- 파일 업로드 테스트
- 타입 체크 통과
```

### 프롬프트 4: 교정 관리 승인 프로세스

```
AGENTS.md와 API_STANDARDS.md를 참조하여 교정 관리 승인 프로세스를 구현해줘.

요구사항:
- 기술책임자 등록: Comment 필드 필수 입력 (검토 완료 표시)
- 시험실무자 등록: 기술책임자 승인 필요 (상태: pending_approval → approved)
- 교정 기록에 등록자 역할 구분 (registeredBy, approvedBy)
- 중간점검 알림 기능 추가 (교정 알림과 함께)

파일:
- packages/db/src/schema/calibrations.ts (approval_status, registered_by, approved_by, comment 필드 추가)
- apps/backend/src/modules/calibration/calibration.service.ts (승인 로직)
- apps/backend/src/modules/calibration/calibration.controller.ts (승인 엔드포인트)
- apps/backend/src/modules/notifications/notifications.service.ts (중간점검 알림)
- apps/frontend/app/calibration/register/page.tsx (등록자 역할에 따른 UI)
- apps/frontend/app/admin/calibration-approvals/page.tsx (승인 관리 페이지)

제약사항:
- 기술책임자는 Comment 입력 필수
- 시험실무자 등록은 승인 대기 상태
- API_STANDARDS 준수
- 중복 제거

검증:
- 승인 프로세스 테스트
- 알림 기능 테스트
- 타입 체크 통과
```

### 프롬프트 5: 반입 프로세스 개선

```
AGENTS.md와 API_STANDARDS.md를 참조하여 반입 프로세스를 개선해줘.

요구사항:
- 반입 시 검사 항목: 교정 여부 확인, 수리 여부 확인, 작동 여부 확인
- 검사 결과 기록 (inspectionNotes)
- 기술책임자 최종 승인 필요 (상태: returned → final_approved)
- 반입 승인 후 장비 상태 자동 복원

파일:
- packages/db/src/schema/checkouts.ts (finalApproverId, inspectionStatus 필드 추가)
- apps/backend/src/modules/checkouts/dto/return-checkout.dto.ts (검사 항목 추가)
- apps/backend/src/modules/checkouts/checkouts.service.ts (반입 승인 로직)
- apps/backend/src/modules/checkouts/checkouts.controller.ts (반입 승인 엔드포인트)
- apps/frontend/app/checkouts/manage/page.tsx (반입 검사 UI)
- apps/frontend/app/admin/return-approvals/page.tsx (반입 승인 페이지)

제약사항:
- 검사 항목은 선택 가능 (최소 1개 이상)
- 기술책임자만 최종 승인 가능
- API_STANDARDS 준수
- 기존 반입 기능과 호환성 유지

검증:
- 반입 프로세스 E2E 테스트
- 검사 항목 검증 테스트
- 타입 체크 통과
```

### 프롬프트 6: 보정계수 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 보정계수 관리 기능을 구현해줘.

요구사항:
- 장비에 보정계수 필드 추가 (calibrationFactors: JSON 또는 별도 테이블)
- 보정계수 등록/수정 시 기술책임자 승인 필요
- 보정계수 변경 이력 자동 기록
- 보정계수 대장 자동 등록 (별도 테이블 또는 리포트)

파일:
- packages/db/src/schema/equipment.ts (calibrationFactors 필드 추가)
- packages/db/src/schema/calibration-factors.ts (새 테이블: 보정계수 이력)
- apps/backend/src/modules/equipment/dto/update-equipment.dto.ts (보정계수 필드)
- apps/backend/src/modules/equipment/equipment.service.ts (보정계수 승인 로직)
- apps/frontend/app/equipment/[id]/calibration-factors/page.tsx (보정계수 관리 페이지)
- apps/frontend/app/admin/calibration-factor-approvals/page.tsx (승인 페이지)

제약사항:
- 보정계수는 교정 시마다 변경 가능
- 변경 이력은 영구 보관
- API_STANDARDS 준수
- 타입 안전성 보장

검증:
- 보정계수 변경 이력 테스트
- 승인 프로세스 테스트
- 타입 체크 통과
```

### 프롬프트 7: 부적합 장비 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 부적합 장비 관리 기능을 구현해줘.

요구사항:
- 부적합 발견 시 장비 상태를 'non_conforming'으로 변경
- 부적합 기록 등록 (원인, 발견일, 조치 계획)
- 원인분석/조치 기록 (분석 내용, 조치 내용, 조치일)
- 사용 재개 승인 (기술책임자 승인 필요)
- 부적합 이력 영구 보관

파일:
- packages/db/src/schema/equipment.ts (status에 'non_conforming' 추가)
- packages/db/src/schema/non-conformances.ts (새 테이블: 부적합 기록)
- apps/backend/src/modules/equipment/equipment.service.ts (부적합 처리)
- apps/backend/src/modules/equipment/equipment.controller.ts (부적합 엔드포인트)
- apps/frontend/app/equipment/[id]/non-conformance/page.tsx (부적합 관리 페이지)
- apps/frontend/app/equipment/[id]/page.tsx (부적합 상태 표시)

제약사항:
- 부적합 장비는 즉시 사용 중단
- 재개 승인 전까지 사용 불가
- API_STANDARDS 준수
- 이력 추적 가능

검증:
- 부적합 프로세스 E2E 테스트
- 재개 승인 테스트
- 타입 체크 통과
```

### 프롬프트 8: 공용장비 관리

```
AGENTS.md와 API_STANDARDS.md를 참조하여 공용장비(Safety lab) 관리 기능을 구현해줘.

요구사항:
- 장비에 isShared 필드 추가 (공용장비 여부)
- 공용장비는 일회성 등록 가능 (최소 정보만)
- 교정성적서 파일 첨부
- 관리기록 등록
- 공용장비는 대여/반출만 가능 (등록/수정 제한)

파일:
- packages/db/src/schema/equipment.ts (isShared, sharedSource 필드 추가)
- apps/backend/src/modules/equipment/dto/create-equipment.dto.ts (공용장비 플래그)
- apps/backend/src/modules/equipment/equipment.service.ts (공용장비 처리 로직)
- apps/frontend/app/equipment/create-shared/page.tsx (공용장비 등록 페이지)

제약사항:
- 공용장비는 최소 정보만 입력
- 교정성적서는 파일로 보관
- API_STANDARDS 준수
- 일반 장비와 구분

검증:
- 공용장비 등록 테스트
- 파일 첨부 테스트
- 타입 체크 통과
```

### 프롬프트 9: 소프트웨어 관리대장

```
AGENTS.md와 API_STANDARDS.md를 참조하여 소프트웨어 관리대장 기능을 구현해줘.

요구사항:
- 장비에 software 필드 확장 (현재 softwareVersion만 있음)
- Software 등록/변경 시 검증 기록 보관
- Software 변경 History 테이블
- Software 통합 관리대장 (모든 장비의 Software 현황)
- Software별 장비 목록 조회

파일:
- packages/db/src/schema/equipment.ts (software 필드 확장)
- packages/db/src/schema/software-history.ts (새 테이블: Software 변경 이력)
- packages/db/src/schema/software-registry.ts (새 테이블: Software 통합 대장)
- apps/backend/src/modules/equipment/equipment.service.ts (Software 변경 로직)
- apps/backend/src/modules/software/software.module.ts (새 모듈)
- apps/frontend/app/software/page.tsx (Software 관리대장 페이지)
- apps/frontend/app/equipment/[id]/software/page.tsx (장비별 Software 이력)

제약사항:
- Software 변경 시 검증 기록 필수
- 변경 이력 영구 보관
- API_STANDARDS 준수
- 타입 안전성 보장

검증:
- Software 변경 이력 테스트
- 통합 대장 조회 테스트
- 타입 체크 통과
```

### 프롬프트 10: 교정계획서

```
AGENTS.md와 API_STANDARDS.md를 참조하여 교정계획서 기능을 구현해줘.

요구사항:
- 연간 교정계획서 작성 (해당 연도 교정 대상 장비 목록)
- 기술책임자가 계획서 작성
- 시험소장 승인 프로세스
- 계획서 출력 기능 (PDF)
- 계획서 이력 관리

파일:
- packages/db/src/schema/calibration-plans.ts (새 테이블: 교정계획서)
- apps/backend/src/modules/calibration/calibration-plan.service.ts (새 서비스)
- apps/backend/src/modules/calibration/calibration-plan.controller.ts (새 컨트롤러)
- apps/frontend/app/calibration/plan/create/page.tsx (계획서 작성 페이지)
- apps/frontend/app/admin/calibration-plan-approvals/page.tsx (시험소장 승인 페이지)
- apps/frontend/app/calibration/plan/[id]/export/page.tsx (PDF 출력)

제약사항:
- 연도별 계획서 관리
- 시험소장 승인 필수
- PDF 출력 기능
- API_STANDARDS 준수

검증:
- 계획서 작성/승인 프로세스 테스트
- PDF 출력 테스트
- 타입 체크 통과
```

### 프롬프트 11: 중간점검 알림

```
AGENTS.md와 API_STANDARDS.md를 참조하여 중간점검 알림 기능을 구현해줘.

요구사항:
- 장비에 중간점검일정 필드 활용 (needsIntermediateCheck, intermediateCheckDate)
- 교정 알림과 함께 중간점검 알림 발송
- 알림 대상: 해당 팀의 시험실무자와 기술책임자
- 알림 주기: 중간점검일정 D-30일, D-7일, 당일

파일:
- apps/backend/src/modules/notifications/notifications.service.ts (중간점검 알림 로직)
- apps/backend/src/modules/notifications/schedulers/intermediate-check-scheduler.ts (새 스케줄러)
- apps/frontend/components/notifications/IntermediateCheckAlert.tsx (알림 컴포넌트)

제약사항:
- 교정 알림과 통합 관리
- 스케줄러는 cron job 또는 queue 사용
- API_STANDARDS 준수
- 중복 알림 방지

검증:
- 알림 발송 테스트
- 스케줄러 테스트
- 타입 체크 통과
```

### 프롬프트 12: 데이터 보관 및 백업 정책

```
AGENTS.md를 참조하여 데이터 보관 및 백업 정책을 구현해줘.

요구사항:
- 5년 보관 정책 구현 (자동 아카이빙)
- 데이터 용량 모니터링
- 백업 주기 설정 (일일/주간/월간)
- 백업본 관리 (로컬/원격)
- 백업 복원 프로세스

파일:
- apps/backend/src/modules/archive/archive.service.ts (새 서비스)
- apps/backend/src/modules/backup/backup.service.ts (새 서비스)
- apps/backend/src/modules/monitoring/storage.monitor.ts (용량 모니터링)
- scripts/backup.sh (백업 스크립트)
- scripts/restore.sh (복원 스크립트)

제약사항:
- 5년 초과 데이터는 자동 아카이빙
- 백업은 암호화 저장
- API_STANDARDS 준수
- 복원 프로세스 문서화

검증:
- 아카이빙 프로세스 테스트
- 백업/복원 테스트
- 용량 모니터링 테스트
```

---

## 구현 우선순위

### Phase 1 (즉시 시작)

1. 사용자 역할 시스템 개선
2. 사이트별 권한 관리

### Phase 2 (Phase 1 완료 후)

3. 장비 등록/수정/삭제 승인 프로세스
4. 교정 관리 승인 프로세스
5. 반입 프로세스 개선

### Phase 3 (Phase 2 완료 후)

6. 보정계수 관리
7. 부적합 장비 관리
8. 중간점검 알림

### Phase 4 (Phase 3 완료 후)

9. 공용장비 관리
10. 소프트웨어 관리대장
11. 교정계획서

### Phase 5 (Phase 4 완료 후)

12. 데이터 보관 및 백업 정책

---

## 각 프롬프트 사용 가이드

1. 프롬프트를 복사하여 새 대화에서 사용
2. AGENTS.md와 관련 문서를 함께 참조
3. 단계별로 진행 (큰 작업은 작은 단계로 분할)
4. 각 단계 완료 후 검증
5. 다음 단계로 진행

---

End of IMPLEMENTATION_ROADMAP.md
