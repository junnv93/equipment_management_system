# 장비 목록 및 상세 페이지 통합 테스트

## Application Overview

장비 관리 시스템의 장비 목록/상세 페이지 전체 기능 테스트. 인증은 storageState 기반 auth.fixture.ts 사용 (testOperatorPage, techManagerPage, qualityManagerPage, siteAdminPage). 목록: 필터/검색/정렬/뷰/페이지네이션. 상세: 9개 탭, KPI 스트립, 수정, 이력 등록, 역할별 권한, 교정 직무분리.

## Test Scenarios

### 1. 장비 목록 페이지 기능

**Seed:** `apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts`

#### 1.1. 상태 요약 스트립으로 필터링

**File:** `tests/e2e/features/equipment/comprehensive/list-status-strip-filter.spec.ts`

**Steps:**

1. 기술책임자(techManagerPage)로 /equipment 이동
2. 상태 요약 스트립에서 '사용 가능 상태로 필터링' 버튼 클릭
3. 테이블에 사용 가능 상태 장비만 표시 확인
4. '부적합 상태로 필터링' 버튼 클릭
5. 테이블에 부적합 상태 장비만 표시 확인
6. '폐기 대기 상태로 필터링' 버튼 클릭
7. '전체 장비 보기' 버튼 클릭하여 필터 해제

**Expected Results:**

- 각 상태 버튼 클릭 시 해당 상태 장비만 필터링됨
- URL에 status 파라미터 반영
- 전체 보기 클릭 시 모든 필터 해제

#### 1.2. 텍스트 검색 기능

**File:** `tests/e2e/features/equipment/comprehensive/list-text-search.spec.ts`

**Steps:**

1. 기술책임자로 /equipment 이동
2. 검색바(placeholder: 장비명, 모델명, 관리번호로 검색)에 '스펙트럼' 입력 후 Enter
3. 스펙트럼 관련 장비만 표시 확인
4. 검색어 삭제 후 전체 목록 복원 확인
5. 'SUW-E0007'로 검색하여 안테나 시스템 1만 표시 확인

**Expected Results:**

- 장비명 검색 시 매칭 장비만 표시
- 관리번호 검색 시 정확한 장비만 표시
- 검색어 삭제 시 전체 목록 복원

#### 1.3. 정렬 기능

**File:** `tests/e2e/features/equipment/comprehensive/list-sorting.spec.ts`

**Steps:**

1. 기술책임자로 /equipment 이동
2. '관리번호로 정렬' 컬럼 헤더 버튼 클릭
3. URL에 sortBy 파라미터 반영 확인
4. 같은 헤더 다시 클릭하여 정렬 방향 토글 확인
5. '교정 기한로 정렬' 헤더 클릭하여 다른 필드 정렬 확인

**Expected Results:**

- 컬럼 헤더 클릭 시 해당 필드로 정렬
- 재클릭 시 정렬 방향 토글(오름차순↔내림차순)
- 정렬 상태가 URL 파라미터에 반영

#### 1.4. 테이블/카드 뷰 전환

**File:** `tests/e2e/features/equipment/comprehensive/list-view-toggle.spec.ts`

**Steps:**

1. 기술책임자로 /equipment 이동
2. radiogroup '보기 방식 선택'에서 '테이블 뷰' 라디오가 기본 선택 확인
3. grid '장비 목록'이 표시됨 확인
4. '카드 뷰' 라디오 버튼 클릭
5. grid가 사라지고 카드 레이아웃 표시 확인
6. '테이블 뷰' 라디오 다시 클릭하여 테이블 복원

**Expected Results:**

- 기본값은 테이블 뷰
- 카드 뷰 전환 시 카드 그리드 레이아웃 표시
- 테이블 뷰 복원 시 grid '장비 목록' 다시 표시

#### 1.5. 페이지네이션

**File:** `tests/e2e/features/equipment/comprehensive/list-pagination.spec.ts`

**Steps:**

1. 기술책임자로 /equipment 이동
2. navigation '페이지 탐색'에서 '총 22개 중 1-20' 텍스트 확인
3. 첫 페이지에서 '이전 페이지' 버튼이 disabled 확인
4. '2 페이지로 이동' 버튼 클릭
5. 나머지 장비 표시 확인
6. combobox '페이지당 항목 수 선택'에서 항목 수 변경 가능 확인

**Expected Results:**

- 페이지 전환 시 해당 범위 데이터 표시
- 첫 페이지에서 이전 버튼 비활성화
- 페이지당 항목 수 변경 가능

#### 1.6. Primary 필터 (사이트/상태/교정기한)

**File:** `tests/e2e/features/equipment/comprehensive/list-primary-filters.spec.ts`

**Steps:**

1. 시험소장으로 /equipment 이동 (사이트 필터 자유 선택 가능)
2. 사이트 필터(aria-label: 사이트 필터 선택) 클릭 → 수원랩/의왕랩/평택랩 옵션 확인
3. 수원랩 선택 → URL에 site=suwon 반영, 배지 '사이트: 수원랩' 표시
4. 상태 필터(aria-label: 장비 상태 필터 선택) → '사용 가능' 선택
5. 교정기한 필터(aria-label: 교정 기한 필터 선택) → '기한 임박' 선택
6. 필터 배지 X 버튼으로 개별 필터 제거
7. 초기화 버튼으로 모든 필터 제거

**Expected Results:**

- 각 필터 선택 시 URL 파라미터 동기화
- 필터 배지 표시/제거 정상 동작
- 초기화 시 모든 필터 해제

#### 1.7. Secondary 필터 (교정방법/분류/공용/팀) + 복합 필터

**File:** `tests/e2e/features/equipment/comprehensive/list-secondary-filters.spec.ts`

**Steps:**

1. '추가 필터' 버튼 클릭 → 2차 필터 영역 확장
2. 교정 방법/분류/공용/팀 필터 각각 선택 시 URL 반영 확인
3. 여러 필터 동시 적용 (사이트 + 상태 + 교정방법) → AND 조건 결합
4. 개별 필터 제거 시 다른 필터 유지 확인

**Expected Results:**

- 추가 필터 확장/축소 동작
- 각 2차 필터 URL 반영
- 복합 필터 AND 조건 정상 동작
- 개별 필터 제거 시 나머지 유지

#### 1.8. URL 상태 유지

**File:** `tests/e2e/features/equipment/comprehensive/list-url-state.spec.ts`

**Steps:**

1. 필터 + 검색어 조합 시 URL 파라미터 동기화 확인
2. URL 파라미터로 직접 접근 → 필터 복원 확인
3. 정렬 컬럼 클릭 → URL sortBy/sortOrder 반영
4. 페이지네이션 → URL page 파라미터 반영
5. test_engineer 접속 시 역할별 기본 필터(site=suwon) 자동 적용

**Expected Results:**

- 모든 UI 상태가 URL 파라미터에 동기화
- URL 직접 접근 시 필터 복원
- 역할별 기본 필터 자동 적용

### 2. 장비 상세 페이지 - 정보 표시 및 탭

**Seed:** `apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts`

#### 2.1. 기본 정보 탭 표시 확인

**File:** `tests/e2e/features/equipment/comprehensive/detail-basic-info.spec.ts`

**Steps:**

1. 기술책임자로 /equipment/eeee1007-0007-4007-8007-000000000007 이동
2. heading '안테나 시스템 1' 표시 확인
3. status '장비 상태: 사용 가능' 표시 확인
4. '관리번호: SUW-E0007' 텍스트 확인
5. 반출 신청/수정/폐기 요청 액션 버튼 3개 확인
6. KPI 스트립 5개 카드 버튼 확인 (다음 교정일/현재 위치/반출 이력/유지보수/사고 이력)
7. tab '기본 정보 탭'이 aria-selected=true 확인
8. tabpanel에 '장비 기본 정보' 섹션 (장비명/관리번호/모델명/제조사/시리얼번호) 확인
9. '교정 정보' 섹션 (교정 필요 여부/교정 방법/교정 주기/마지막·다음 교정일) 확인
10. '위치 및 관리 정보' 섹션 (사이트/팀/보관 위치) 확인

**Expected Results:**

- 장비명 '안테나 시스템 1', 관리번호 'SUW-E0007' 표시
- 상태 배지 '사용 가능' 표시
- KPI 스트립에 D-147, SUWON Lab 등 표시
- 기본 정보/교정 정보/위치 정보 3개 섹션 모두 표시

#### 2.2. 9개 탭 전환

**File:** `tests/e2e/features/equipment/comprehensive/detail-tab-navigation.spec.ts`

**Steps:**

1. 기술책임자로 장비 상세 페이지 이동
2. 기본 정보 탭이 기본 선택 확인
3. 교정 이력 탭 클릭 → aria-selected=true, tabpanel 표시
4. 보정계수 탭 클릭 → tabpanel 표시
5. 반출 이력 탭 클릭 → tabpanel 표시
6. 위치 변동 탭 클릭 → tabpanel 표시
7. 유지보수 탭 클릭 → tabpanel 표시
8. 사고 이력 탭 클릭 → tabpanel 표시
9. 소프트웨어 탭 클릭 → tabpanel 표시
10. 첨부파일 탭 클릭 → tabpanel 표시
11. 기본 정보 탭 다시 클릭 → '장비 기본 정보' 텍스트 표시

**Expected Results:**

- 각 탭 클릭 시 해당 패널 내용 표시
- 선택된 탭에 aria-selected=true
- 9개 탭 모두 에러 없이 전환

#### 2.3. KPI 스트립 클릭 시 탭 이동

**File:** `tests/e2e/features/equipment/comprehensive/detail-kpi-tab-link.spec.ts`

**Steps:**

1. 기술책임자로 장비 상세 페이지 이동
2. '다음 교정일 탭으로 이동' 버튼 클릭 → 교정 이력 탭 aria-selected=true 확인
3. '유지보수 탭으로 이동' 버튼 클릭 → 유지보수 탭 aria-selected=true 확인
4. '사고 이력 탭으로 이동' 버튼 클릭 → 사고 이력 탭 확인
5. '반출 이력 탭으로 이동' 버튼 클릭 → 반출 이력 탭 확인
6. '현재 위치 탭으로 이동' 버튼 클릭 → 위치 변동 탭 확인

**Expected Results:**

- KPI 카드 클릭 시 대응 탭으로 자동 전환
- 전환 후 해당 탭 패널 내용 표시

### 3. 역할별 권한 검증

**Seed:** `apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts`

#### 3.1. 시험실무자 권한 범위

**File:** `tests/e2e/features/equipment/comprehensive/role-test-engineer.spec.ts`

**Steps:**

1. 시험실무자(testOperatorPage)로 /equipment 이동
2. link '장비 등록', '공용장비 등록' 표시 확인
3. 안테나 시스템 1 상세 페이지 이동
4. link '수정' 버튼 표시 확인 (수정 가능)
5. button '반출 신청' 표시 확인
6. button '폐기 요청' 표시 확인
7. 교정 이력 탭 → 교정 등록 버튼/링크 표시 확인 (시험실무자만 가능 — 직무분리)
8. 위치 변동 탭 → 위치 변경 등록 버튼 미표시 확인
9. 유지보수 탭 → 유지보수 등록 버튼 미표시 확인
10. 사고 이력 탭 → 사고 등록 버튼 미표시 확인

**Expected Results:**

- 장비 등록/수정/반출/폐기 가능
- 교정 등록 가능 (직무분리)
- 위치/유지보수/사고 이력 등록 불가

#### 3.2. 기술책임자 권한 범위

**File:** `tests/e2e/features/equipment/comprehensive/role-tech-manager.spec.ts`

**Steps:**

1. 기술책임자(techManagerPage)로 /equipment 이동
2. link '장비 등록', '공용장비 등록' 표시 확인
3. 안테나 시스템 1 상세 페이지 이동
4. link '수정', button '반출 신청', button '폐기 요청' 표시 확인
5. 교정 이력 탭 → 교정 등록 버튼/링크 미표시 확인 (직무분리)
6. 위치 변동 탭 → '위치 변경 등록' 버튼 표시 확인 (기술책임자 이상)

**Expected Results:**

- 장비 등록/수정 가능
- 교정 등록 불가 (직무분리), 승인/반려 가능
- 위치 변동 등록 가능

#### 3.3. 시험소장 권한 범위

**File:** `tests/e2e/features/equipment/comprehensive/role-lab-manager.spec.ts`

**Steps:**

1. 시험소장(siteAdminPage)으로 /equipment 이동
2. link '장비 등록', '공용장비 등록' 표시 확인
3. 안테나 시스템 1 상세 페이지 이동
4. link '수정' 표시 확인
5. 교정 이력 탭 → 교정 등록 미표시 확인 (직무분리)
6. 위치 변동 탭 → '위치 변경 등록' 버튼 표시 확인
7. 유지보수 탭 → '유지보수 등록' 버튼 표시 확인
8. 사고 이력 탭 → '사고 등록' 버튼 표시 확인

**Expected Results:**

- 전체 CRUD 권한 (조건부 삭제 포함)
- 교정 등록 불가 (직무분리), 승인 가능
- 위치/유지보수/사고 이력 등록 가능

#### 3.4. 품질책임자 읽기 전용 확인

**File:** `tests/e2e/features/equipment/comprehensive/role-quality-manager.spec.ts`

**Steps:**

1. 품질책임자(qualityManagerPage)로 /equipment 이동
2. 장비 목록 표시 확인
3. 안테나 시스템 1 상세 페이지 이동
4. 기본 정보 읽기 가능 확인 (SUW-E0007)
5. 교정 이력 탭 → 교정 등록 버튼 미표시
6. 위치 변동 탭 → 등록 버튼 미표시
7. 유지보수 탭 → 등록 버튼 미표시
8. 사고 이력 탭 → 등록 버튼 미표시

**Expected Results:**

- 장비 목록/상세 조회 가능
- 대부분 읽기 전용 (제한된 쓰기 권한)

#### 3.5. 교정 등록 직무분리 확인 (UL-QP-18)

**File:** `tests/e2e/features/equipment/comprehensive/detail-calibration-role-separation.spec.ts`

**Steps:**

1. 기술책임자로 상세 페이지 → 교정 이력 탭 → 교정 등록 버튼/링크 미표시 확인
2. 시험소장으로 상세 페이지 → 교정 이력 탭 → 교정 등록 버튼/링크 미표시 확인

**Expected Results:**

- 기술책임자: 교정 등록 불가
- 시험소장: 교정 등록 불가
- 시험실무자만 교정 등록 가능 (UL-QP-18 직무분리)
