# 교정성적서 (Calibration Certificate) 통합 E2E 테스트 플랜

## Application Overview

교정성적서 페이지의 전체 비즈니스 프로세스를 검증하는 E2E 테스트 플랜입니다.

## 아키텍처 요약

- Frontend: Next.js 16 App Router + TanStack Query (URL-driven SSOT 필터)
- Backend: NestJS + Drizzle ORM + CAS (Optimistic Locking)
- Auth: NextAuth storageState 기반 (5개 역할 fixture)
- DB: PostgreSQL (단일 DB, 테스트 DB 분리 없음)

## 테스트 범위

1. 교정 관리 목록 페이지 (/calibration) - 통계, 탭, 필터, 검색
2. 교정 등록 페이지 (/calibration/register) - 폼, 자동 계산, 역할별 동작
3. 교정 승인/반려 (/admin/calibration-approvals) - 워크플로우, CAS, 장비 상태 연동
4. 중간점검 완료 - 완료 처리, 날짜 업데이트
5. 권한 검증 - 역할별 접근 제어
6. URL 필터 상태 관리 - SSOT 패턴 검증

## 병렬화 전략 (7 Workers)

- Worker 1: Parallel Group A - 교정 목록 데이터 통합 검증 (읽기 전용)
- Worker 2: Parallel Group B - 교정 등록 폼 UI/자동 계산 (읽기 전용)
- Worker 3: Parallel Group F - URL 필터 상태 관리 (읽기 전용)
- Worker 4: Parallel Group G - 권한 검증 및 에러 처리 (읽기 전용 + 모킹)
- Worker 5: Serial Group C - 등록→승인 E2E 통합 (Equipment ID Set 1)
- Worker 6: Serial Group D - 반려 워크플로우 (Equipment ID Set 2)
- Worker 7: Serial Group E - 중간점검 완료 (Equipment ID Set 3)

## SSOT 준수사항

- import { CalibrationApprovalStatus, CalibrationResult } from '@equipment-management/schemas'
- import { Permission } from '@equipment-management/shared-constants'
- Auth fixtures from shared/fixtures/auth.fixture.ts
- Test data from shared/constants/shared-test-data.ts

## Test Scenarios

### 1. Parallel Group A: 교정 목록 데이터 통합 검증

**Seed:** `tests/e2e/features/calibration/certificate/seeds/calibration-list-seed.spec.ts`

#### 1.1. 통계 카드 수치가 백엔드 API 응답과 정확히 일치한다

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 네트워크 요청에서 /api/calibration/summary 응답을 인터셉트
3. 전체 교정 장비 카드의 수치가 summary.total과 일치하는지 검증
4. 교정 기한 초과 카드의 수치가 summary.overdueCount와 일치하는지 검증
5. 30일 이내 교정 필요 카드의 수치가 summary.dueInMonthCount와 일치하는지 검증
6. 정상 장비 수 = total - overdueCount 계산이 맞는지 검증

**Expected Results:**

- 4개 통계 카드의 수치가 API 응답 데이터와 정확히 일치
- 정상 장비 수 계산이 올바름 (total - overdueCount)

#### 1.2. 전체 탭 테이블 행 수가 API 목록 응답 건수와 일치한다

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 네트워크 요청에서 /api/calibration/history 응답을 인터셉트
3. 전체 탭(기본 활성)의 테이블 행 수를 카운트
4. API 응답의 items 배열 길이와 테이블 행 수를 비교
5. 테이블 컬럼 헤더 검증: 장비명, 관리번호, 팀, 교정일, 다음 교정일, 교정 기관, 상태, 관리

**Expected Results:**

- 테이블 행 수가 API 응답 건수와 일치
- 8개 컬럼 헤더가 모두 표시됨

#### 1.3. 기한 초과 탭의 모든 항목이 실제로 nextCalibrationDate < today인지 검증

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 기한 초과 탭 클릭
3. 네트워크 요청에서 /api/calibration/overdue 응답을 인터셉트
4. 테이블의 각 행에서 '다음 교정일' 컬럼 값을 읽음
5. 모든 다음 교정일이 오늘 이전인지 Date 비교 검증
6. 빨간색 상태 배지가 표시되는지 확인

**Expected Results:**

- 모든 표시된 항목의 다음 교정일이 오늘 이전
- API overdue 엔드포인트 응답과 UI 표시 건수 일치
- 상태 배지가 빨간색(overdue) 스타일 적용

#### 1.4. 30일 이내 예정 탭의 D-day 배지가 실제 날짜 차이와 일치한다

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 30일 이내 예정 탭 클릭
3. 네트워크 요청에서 /api/calibration/upcoming/30 응답을 인터셉트
4. 테이블의 첫 번째 행에서 D-day 배지 텍스트를 읽음 (예: 'D-7')
5. 해당 행의 다음 교정일과 오늘 날짜의 차이를 계산
6. D-day 배지의 숫자와 계산된 날짜 차이가 일치하는지 검증

**Expected Results:**

- D-day 배지 숫자가 실제 날짜 차이(nextCalibrationDate - today)와 일치
- 모든 항목이 30일 이내에 해당

#### 1.5. 장비명 클릭 시 해당 장비 상세 페이지로 정확히 이동한다

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 전체 탭의 첫 번째 행에서 장비명 링크의 href 속성을 읽음
3. 장비명 링크 클릭
4. URL이 /equipment/{id} 패턴으로 변경되는지 waitForURL로 검증
5. 장비 상세 페이지의 제목이 클릭한 장비명과 일치하는지 검증

**Expected Results:**

- URL이 /equipment/{equipmentId} 형식으로 이동
- 장비 상세 페이지의 제목이 원래 테이블에 표시된 장비명과 일치

#### 1.6. 교정 정보 등록 버튼 클릭 시 올바른 equipmentId가 전달된다

**File:** `tests/e2e/features/calibration/certificate/list-data-integrity.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 전체 탭의 첫 번째 행에서 '교정 정보 등록' 링크/버튼의 href 읽음
3. 링크 클릭
4. URL에 equipmentId 쿼리 파라미터가 포함되었는지 검증
5. 교정 등록 폼의 장비 정보가 원래 행의 장비와 일치하는지 검증

**Expected Results:**

- /calibration/register?equipmentId={id} 형식으로 이동
- 등록 폼에 올바른 장비가 선택된 상태

### 2. Parallel Group B: 교정 등록 폼 자동 계산 및 역할별 동작

**Seed:** `tests/e2e/features/calibration/certificate/seeds/calibration-register-seed.spec.ts`

#### 2.1. 장비 선택 시 좌측 패널에서 선택 하이라이트가 표시된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 좌측 장비 목록에서 첫 번째 장비 클릭
3. 선택된 장비에 파란색 border/background 하이라이트가 적용되는지 확인
4. 우측 폼 영역에 장비명이 표시되는지 확인
5. 다른 장비 클릭 시 이전 선택 해제되고 새 장비가 하이라이트되는지 확인

**Expected Results:**

- 선택된 장비에 시각적 하이라이트(blue border) 적용
- 한 번에 하나의 장비만 선택 상태
- 우측 폼에 선택된 장비 정보 표시

#### 2.2. 교정일과 교정 주기 입력 시 다음 교정일이 자동 계산된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 선택
3. 교정일에 '2026-02-15' 입력
4. 교정 주기 드롭다운에서 '12개월' 선택
5. 다음 교정일 필드 값이 '2027-02-15'로 자동 설정되는지 확인
6. 교정 주기를 '6개월'로 변경
7. 다음 교정일이 '2026-08-15'로 재계산되는지 확인

**Expected Results:**

- 12개월 주기: 다음 교정일 = 교정일 + 12개월
- 6개월 주기: 다음 교정일 = 교정일 + 6개월
- 주기 변경 시 즉시 재계산

#### 2.3. 중간점검일이 교정 주기의 50%로 자동 계산된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 선택
3. 교정일에 '2026-02-15' 입력
4. 교정 주기 '12개월' 선택
5. 중간점검일 필드 값이 '2026-08-15' (6개월 후)로 자동 설정되는지 확인
6. 교정 주기를 '24개월'로 변경
7. 중간점검일이 '2027-02-15' (12개월 후)로 재계산되는지 확인

**Expected Results:**

- 중간점검일 = 교정일 + (교정 주기 / 2)
- 주기 변경 시 중간점검일도 재계산

#### 2.4. 시험실무자에게 승인 대기 안내 Alert가 표시된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 선택
3. Alert 컴포넌트에 '기술책임자의 승인' 텍스트가 포함되어 있는지 확인
4. '등록자 코멘트' 필드가 숨겨져 있는지 확인 (시험실무자에게는 불필요)

**Expected Results:**

- 승인 대기 안내 Alert 표시
- 등록자 코멘트 필드 미표시 (시험실무자 역할)

#### 2.5. 기술책임자에게 즉시 승인 안내와 코멘트 필수 필드가 표시된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. techManagerPage로 /calibration/register 이동
2. 장비 선택
3. Alert 컴포넌트에 '즉시 승인' 텍스트가 포함되어 있는지 확인
4. '등록자 코멘트' (registrarComment) 필드가 표시되는지 확인
5. 코멘트 필드에 필수(\*) 표시가 있는지 확인

**Expected Results:**

- 즉시 승인 안내 Alert 표시
- 등록자 코멘트 필드 표시 (기술책임자 전용)
- 코멘트 필드가 필수 항목으로 표시

#### 2.6. 장비 검색으로 좌측 패널 장비 목록이 필터링된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 좌측 패널의 검색 input에 'Spectrum' 입력
3. 장비 목록이 필터링되어 'Spectrum' 포함 장비만 표시되는지 확인
4. 검색어 지우기
5. 전체 장비 목록이 다시 표시되는지 확인

**Expected Results:**

- 검색어에 매칭되는 장비만 목록에 표시
- 검색어 제거 시 전체 목록 복원

#### 2.7. 교정 결과 드롭다운에 SSOT 값 3개가 정확히 표시된다

**File:** `tests/e2e/features/calibration/certificate/register-form.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 선택
3. 교정 결과 combobox 클릭
4. listbox에 정확히 3개 option이 표시되는지 확인
5. '적합' (pass) 옵션 존재 확인
6. '부적합' (fail) 옵션 존재 확인
7. '조건부 적합' (conditional) 옵션 존재 확인

**Expected Results:**

- CalibrationResultEnum SSOT와 일치하는 3개 옵션 표시
- 각 옵션의 한국어 라벨이 정확

### 3. Serial Group C: 교정 등록 → 승인 → 장비 상태 업데이트 통합 플로우

**Seed:** `tests/e2e/features/calibration/certificate/seeds/registration-approval-seed.spec.ts`

#### 3.1. 시험실무자가 교정 등록 후 승인 대기 목록에 새 기록이 표시된다

**File:** `tests/e2e/features/calibration/certificate/registration-approval-flow.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 목록에서 테스트용 장비 선택 (SPECTRUM_ANALYZER_SUW_E)
3. 교정일: 오늘 날짜, 교정 주기: 12개월, 교정 기관: 'Test Agency', 결과: '적합' 입력
4. 등록 버튼 클릭
5. 성공 토스트 메시지 확인: '기술책임자의 승인을 기다려주세요'
6. /calibration으로 리다이렉트되는지 waitForURL 검증
7. techManagerPage로 /admin/calibration-approvals 이동
8. 승인 대기 목록에 방금 등록한 기록이 표시되는지 확인 (장비명, 교정 기관으로 매칭)
9. 상태 배지가 'pending_approval' 스타일인지 확인

**Expected Results:**

- 교정 등록 성공 및 승인 대기 토스트 표시
- /calibration으로 리다이렉트
- 승인 대기 목록에 새 기록 표시 (교정 기관: 'Test Agency')
- 등록자 역할이 '시험실무자'로 표시

#### 3.2. 기술책임자 승인 시 장비의 교정일/다음교정일이 자동 업데이트된다

**File:** `tests/e2e/features/calibration/certificate/registration-approval-flow.spec.ts`

**Steps:**

1. techManagerPage로 /admin/calibration-approvals 이동
2. 이전 테스트에서 등록한 기록의 '승인' 버튼 클릭
3. 승인 다이얼로그에서 검토 코멘트 입력 (선택사항)
4. '승인' 확인 버튼 클릭
5. 성공 토스트 메시지 확인
6. 승인 대기 목록에서 해당 기록이 사라지는지 확인
7. techManagerPage로 /equipment/{equipmentId}?tab=calibration 이동
8. 장비 상세의 '최근 교정일'이 등록한 교정일과 일치하는지 확인
9. 장비 상세의 '다음 교정일'이 교정일 + 12개월과 일치하는지 확인

**Expected Results:**

- 승인 완료 토스트 표시
- 승인 대기 목록에서 기록 제거
- 장비의 lastCalibrationDate = 등록한 교정일
- 장비의 nextCalibrationDate = 교정일 + 교정주기
- 교정 이력 탭에 approved 상태 기록 표시

#### 3.3. 기술책임자가 직접 등록 시 즉시 승인되고 registrarComment가 필수이다

**File:** `tests/e2e/features/calibration/certificate/registration-approval-flow.spec.ts`

**Steps:**

1. techManagerPage로 /calibration/register 이동
2. 다른 테스트용 장비 선택
3. 교정일, 교정 주기, 교정 기관, 결과 입력
4. 등록자 코멘트(registrarComment) 미입력 상태에서 등록 시도
5. 유효성 검증 오류 확인 (코멘트 필수)
6. 등록자 코멘트 입력
7. 등록 버튼 클릭
8. 성공 토스트 메시지 확인: '즉시 승인' 관련 메시지
9. 장비 상세 교정 이력에서 즉시 approved 상태인지 확인

**Expected Results:**

- 코멘트 미입력 시 유효성 오류 표시
- 코멘트 입력 후 등록 성공
- 기술책임자 등록은 즉시 approved 상태
- registeredByRole = 'technical_manager'
- 장비 교정일 즉시 업데이트

### 4. Serial Group D: 교정 반려 워크플로우

**Seed:** `tests/e2e/features/calibration/certificate/seeds/rejection-workflow-seed.spec.ts`

#### 4.1. 반려 시 반려 사유 미입력이면 제출할 수 없다

**File:** `tests/e2e/features/calibration/certificate/rejection-workflow.spec.ts`

**Steps:**

1. testOperatorPage로 새 교정 기록 등록 (다른 장비 사용)
2. techManagerPage로 /admin/calibration-approvals 이동
3. 해당 기록의 '반려' 버튼 클릭
4. 반려 사유 다이얼로그 표시 확인
5. 반려 사유 입력 없이 '반려' 버튼 클릭 시도
6. 유효성 검증으로 제출이 차단되는지 확인 (버튼 비활성화 또는 오류 메시지)

**Expected Results:**

- 반려 사유 미입력 시 제출 불가
- 다이얼로그 유지 (닫히지 않음)
- 유효성 오류 메시지 또는 버튼 비활성화

#### 4.2. 반려 사유 입력 후 반려 완료 시 기록 상태가 rejected로 변경된다

**File:** `tests/e2e/features/calibration/certificate/rejection-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /admin/calibration-approvals 이동
2. 해당 기록의 '반려' 버튼 클릭
3. 반려 사유 입력: '교정 성적서 날짜 오류 - 재등록 필요'
4. '반려' 확인 버튼 클릭
5. 성공 토스트 메시지 확인
6. 해당 기록이 승인 대기 목록에서 사라지는지 확인

**Expected Results:**

- 반려 완료 토스트 표시
- 기록이 승인 대기 목록에서 제거
- 기록의 approvalStatus = 'rejected'
- rejectionReason이 저장됨

#### 4.3. 반려된 기록은 장비 교정일에 영향을 주지 않는다

**File:** `tests/e2e/features/calibration/certificate/rejection-workflow.spec.ts`

**Steps:**

1. 반려 처리 후 장비 상세 페이지로 이동 (/equipment/{id})
2. 장비의 '최근 교정일'이 반려된 기록의 교정일로 변경되지 않았는지 확인
3. 장비의 '다음 교정일'이 변경되지 않았는지 확인
4. 교정 이력 탭에서 반려된 기록이 rejected 배지로 표시되는지 확인

**Expected Results:**

- 장비의 lastCalibrationDate 변경 없음
- 장비의 nextCalibrationDate 변경 없음
- 교정 이력에 rejected 상태 기록 표시

### 5. Serial Group E: 중간점검 완료 워크플로우

**Seed:** `tests/e2e/features/calibration/certificate/seeds/intermediate-check-seed.spec.ts`

#### 5.1. 중간점검 탭에서 완료 버튼 클릭 시 확인 다이얼로그가 표시된다

**File:** `tests/e2e/features/calibration/certificate/intermediate-check.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 중간점검 탭 클릭
3. 중간점검 항목이 있는 경우 첫 번째 항목의 '완료' 버튼 클릭
4. 확인 다이얼로그가 표시되는지 확인
5. 다이얼로그에 비고 입력 필드가 있는지 확인
6. 취소 버튼 클릭 시 다이얼로그가 닫히는지 확인

**Expected Results:**

- 완료 확인 다이얼로그 표시
- 비고 입력 필드 존재
- 취소 시 다이얼로그 닫힘 (상태 변경 없음)

#### 5.2. 중간점검 완료 처리 후 해당 항목의 상태가 업데이트된다

**File:** `tests/e2e/features/calibration/certificate/intermediate-check.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 중간점검 탭 클릭
3. 첫 번째 중간점검 항목의 장비명과 현재 상태 기록
4. '완료' 버튼 클릭
5. 확인 다이얼로그에서 비고 입력 (선택사항)
6. '완료' 확인 버튼 클릭
7. 네트워크 요청에서 POST /api/calibration/intermediate-checks/{id}/complete 응답 확인
8. 성공 토스트 메시지 확인
9. 중간점검 탭이 새로고침되어 해당 항목이 사라지거나 완료 상태로 변경되는지 확인

**Expected Results:**

- API 요청 성공 (200 OK)
- 완료 토스트 표시
- 중간점검 목록에서 항목 상태 업데이트
- 요약 카드의 대기 건수 감소

#### 5.3. 중간점검 상태 배지가 D-day에 따라 올바른 색상으로 표시된다

**File:** `tests/e2e/features/calibration/certificate/intermediate-check.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 중간점검 탭 클릭
3. 중간점검 항목들의 상태 배지 확인
4. 기한 초과 항목: 빨간색(red) 'N일 초과' 배지 확인
5. 오늘 예정 항목: 주황색(orange) '오늘' 배지 확인
6. 7일 이내 항목: 노란색(yellow) 'D-N' 배지 확인
7. 7일 초과 항목: 파란색(blue) 'D-N' 배지 확인

**Expected Results:**

- 상태별 색상 코딩이 getIntermediateCheckStatusStyle 로직과 일치
- D-day 숫자가 실제 날짜 차이와 일치

### 6. Parallel Group F: URL 필터 상태 관리 (SSOT 검증)

**Seed:** `tests/e2e/features/calibration/certificate/seeds/url-filter-seed.spec.ts`

#### 6.1. 팀 필터 선택 시 URL에 teamId 파라미터가 반영된다

**File:** `tests/e2e/features/calibration/certificate/url-filter-state.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 팀 필터 combobox 클릭
3. 첫 번째 팀 옵션 선택
4. URL이 /calibration?teamId={selectedTeamId} 형식으로 변경되는지 확인
5. 브라우저 뒤로 가기 클릭
6. 팀 필터가 '모든 팀'으로 복원되는지 확인
7. URL에서 teamId 파라미터가 제거되었는지 확인

**Expected Results:**

- 필터 선택 시 URL 파라미터 자동 추가
- 뒤로 가기 시 필터 상태 복원
- '모든 팀' 선택 시 teamId 파라미터 제거 (SSOT: 전체 = 파라미터 생략)

#### 6.2. URL에 직접 필터 파라미터를 입력하면 해당 필터가 적용된다

**File:** `tests/e2e/features/calibration/certificate/url-filter-state.spec.ts`

**Steps:**

1. techManagerPage로 /calibration?teamId={knownTeamId} 직접 이동
2. 팀 필터 combobox의 선택값이 해당 팀명으로 표시되는지 확인
3. 테이블 데이터가 해당 팀으로 필터링되었는지 확인 (팀 컬럼 값)
4. URL에서 teamId 파라미터를 제거하고 이동 (/calibration)
5. 팀 필터가 '모든 팀'으로 표시되는지 확인

**Expected Results:**

- URL 파라미터로 직접 필터 적용 가능
- UI 필터 상태가 URL과 동기화
- 파라미터 제거 시 기본값(모든 팀) 복원

#### 6.3. 페이지 새로고침 후에도 필터 상태가 URL에서 복원된다

**File:** `tests/e2e/features/calibration/certificate/url-filter-state.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. 팀 필터에서 특정 팀 선택
3. 검색 필드에 검색어 입력
4. 현재 URL을 기록
5. page.reload()로 페이지 새로고침
6. 팀 필터 선택값이 유지되는지 확인
7. 검색 필드 값이 유지되는지 확인
8. 테이블 데이터가 동일하게 필터링되었는지 확인

**Expected Results:**

- 새로고침 후 URL 파라미터 유지
- UI 필터 상태가 URL에서 복원
- 테이블 데이터가 동일하게 필터링

#### 6.4. 역할별 기본 필터가 서버 사이드에서 올바르게 적용된다

**File:** `tests/e2e/features/calibration/certificate/url-filter-state.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration 이동 (필터 없이)
2. URL에 site와 teamId 파라미터가 자동 추가되었는지 확인 (시험실무자: site + teamId 기본 적용)
3. techManagerPage로 /calibration 이동 (필터 없이)
4. URL에 site와 teamId 파라미터가 자동 추가되었는지 확인 (기술책임자: site + teamId 기본 적용)
5. siteAdminPage로 /calibration 이동 (필터 없이)
6. URL에 site 파라미터만 자동 추가되었는지 확인 (시험소장: site만 적용)

**Expected Results:**

- 시험실무자/기술책임자: site + teamId 기본 필터 리다이렉트
- 시험소장: site만 기본 필터 리다이렉트
- system_admin: 필터 없이 전체 조회

### 7. Parallel Group G: 권한 검증 및 에러 처리

**Seed:** `tests/e2e/features/calibration/certificate/seeds/permission-error-seed.spec.ts`

#### 7.1. 품질책임자는 교정 등록 페이지에 접근할 수 없다

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. qualityManagerPage로 /calibration/register 이동 시도
2. 접근 거부 또는 리다이렉트 확인
3. 교정 등록 폼이 표시되지 않는지 확인

**Expected Results:**

- 품질책임자는 교정 등록 불가 (권한 없음)
- 접근 거부 메시지 또는 대시보드로 리다이렉트

#### 7.2. 시험실무자는 승인 페이지에 접근할 수 없다

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. testOperatorPage로 /admin/calibration-approvals 이동 시도
2. 접근 거부 또는 빈 목록 확인
3. 승인/반려 버튼이 표시되지 않는지 확인

**Expected Results:**

- 시험실무자는 승인 기능 접근 불가
- APPROVE_CALIBRATION 권한 없음으로 차단

#### 7.3. 교정 등록 시 필수 필드 미입력이면 API 요청이 차단된다

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. testOperatorPage로 /calibration/register 이동
2. 장비 선택
3. 교정 기관 필드를 비워둔 채 등록 시도
4. 프론트엔드 유효성 검증으로 제출이 차단되는지 확인
5. 네트워크 요청이 발생하지 않는지 확인 (불필요한 API 호출 방지)

**Expected Results:**

- 프론트엔드 유효성 검증이 API 호출 전에 차단
- 유효성 오류 메시지 표시
- 불필요한 네트워크 요청 미발생

#### 7.4. CAS 버전 충돌 시 자동 캐시 무효화 및 서버 재검증이 수행된다

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. techManagerPage로 /admin/calibration-approvals 이동
2. 승인 대기 항목이 있는 경우 해당 항목의 승인 시도
3. 네트워크 요청을 route로 인터셉트하여 409 VERSION_CONFLICT 응답 모킹
4. 승인 버튼 클릭
5. VERSION_CONFLICT 에러 토스트 메시지 확인: '다른 사용자가 동시에 수정했습니다'
6. 자동으로 승인 대기 목록이 재조회(invalidateQueries)되는지 네트워크 확인

**Expected Results:**

- 409 Conflict 시 VERSION_CONFLICT 에러 메시지 표시
- TanStack Query가 자동으로 캐시 무효화
- 최신 데이터로 목록 자동 갱신
- 사용자에게 재시도 안내

#### 7.5. 네트워크 오류 시 에러 상태가 올바르게 표시된다

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. techManagerPage로 /calibration 이동
2. route 인터셉트로 /api/calibration/summary 요청을 500 Internal Server Error로 모킹
3. 페이지 새로고침
4. 에러 상태 UI가 표시되는지 확인 (Error Boundary 또는 에러 메시지)
5. 재시도 버튼이 있는 경우 클릭하여 복구 가능한지 확인

**Expected Results:**

- 500 에러 시 Error Boundary 또는 에러 메시지 표시
- 크래시 없이 사용자에게 적절한 안내
- 재시도로 정상 복구 가능

#### 7.6. 시험소장(lab_manager)은 교정 등록을 직접 할 수 없다 (UL-QP-18 직무분리)

**File:** `tests/e2e/features/calibration/certificate/permission-error.spec.ts`

**Steps:**

1. siteAdminPage로 장비 상세 페이지의 교정 탭 이동
2. 교정 등록 버튼이 표시되지 않거나 비활성화되어 있는지 확인
3. 또는 /calibration/register로 직접 이동 시도 시 접근 제한 확인

**Expected Results:**

- 시험소장은 교정 등록 불가 (UL-QP-18 직무분리 원칙)
- 승인만 가능, 등록은 시험실무자/기술책임자만 가능
