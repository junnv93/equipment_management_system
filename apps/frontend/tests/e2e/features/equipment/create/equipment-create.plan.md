# 장비 등록 페이지 E2E 테스트 계획

## Application Overview

장비 등록 시스템의 E2E 테스트 계획입니다. 일반 장비 등록(/equipment/create)과 공용/렌탈 장비 임시등록(/equipment/create-shared) 페이지를 대상으로 합니다.

## 테스트 범위

- 역할 기반 승인 워크플로우 (시험실무자 vs 기술책임자/시험소관리자)
- 폼 유효성 검사 및 에러 처리
- 파일 업로드 (multipart/form-data)
- 이력 데이터 병렬 저장 (Promise.all)
- DB 검증을 통한 전체 프로세스 통합 검증

## SSOT 준수 사항

- `@equipment-management/schemas`: CreateEquipmentInput, EquipmentStatus, CalibrationMethod 등
- `@equipment-management/shared-constants`: Permission.CREATE_EQUIPMENT, Permission.APPROVE_EQUIPMENT 등
- API 엔드포인트: POST /api/equipment, POST /api/equipment/shared

## 인증 픽스처 사용

- testOperatorPage: 시험실무자 (승인 요청 생성)
- techManagerPage: 기술책임자 (직접 등록)
- siteAdminPage: 시험소 관리자 (직접 등록 + 자동 승인)

## Test Scenarios

### 1. 일반 장비 등록 - 역할별 승인 워크플로우

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 1.1. 시험실무자는 장비 등록 시 승인 요청을 생성한다

**File:** `apps/frontend/tests/e2e/equipment-create/approval-workflow.spec.ts`

**Steps:**

1. testOperatorPage로 /equipment/create 페이지 이동
2. 권한 배너에서 '현재 권한: 시험실무자'와 '승인 필요' 뱃지 확인
3. 기본 정보 입력: 장비명='테스트 장비', 사이트='suwon' 선택
4. 사이트 선택 후 팀 드롭다운 활성화 확인
5. 팀 선택하면 분류코드 자동 설정 확인
6. 관리번호 일련번호 입력: '0001'
7. 관리번호 미리보기: 'SUW-E 0001' 형식 확인
8. 모델명, 제조사, 시리얼번호 입력
9. 교정 정보: 관리 방법='외부 교정' 선택
10. 교정 주기, 최종 교정일 입력 시 차기 교정일 자동 계산 확인
11. 상태 및 위치 섹션: 현재 위치 입력
12. 기술책임자 드롭다운에서 선택
13. '등록 (승인 요청)' 버튼 클릭
14. 승인 요청 확인 모달 표시 확인
15. 모달에서 '요청하기' 버튼 클릭
16. 토스트 메시지 '등록 요청 완료' 확인
17. /equipment 페이지로 리다이렉트 확인
18. API 응답에서 requestUuid 반환 확인 (uuid 아님)

**Expected Results:**

- 권한 배너에 '시험실무자' 및 '승인 필요' 표시
- 팀 선택 시 분류코드 자동 설정
- 관리번호가 'SUW-E 0001' 형식으로 생성
- 승인 요청 확인 모달 표시
- API 응답: { requestUuid: 'uuid', message: '장비 등록 요청이 생성되었습니다.' }
- 장비 목록에는 아직 표시되지 않음 (승인 대기 중)

#### 1.2. 기술책임자는 장비를 직접 등록할 수 있다

**File:** `apps/frontend/tests/e2e/equipment-create/approval-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 권한 배너에서 '현재 권한: 기술책임자'와 '직접 처리' 뱃지 확인
3. 필수 정보 입력 (장비명, 사이트, 팀, 관리번호 일련번호, 모델명, 제조사, 시리얼번호, 현재 위치, 기술책임자)
4. '등록' 버튼 클릭 (승인 요청 문구 없음)
5. 승인 확인 모달 없이 바로 처리됨 확인
6. 토스트 메시지 '장비 등록 완료' 확인
7. /equipment 페이지로 리다이렉트 확인
8. API 응답에서 uuid 반환 확인 (requestUuid 아님)
9. GET /api/equipment/{uuid} 호출하여 DB 저장 확인

**Expected Results:**

- 권한 배너에 '기술책임자' 및 '직접 처리' 표시
- 승인 모달 없이 바로 등록 처리
- API 응답: { uuid: 'uuid', name: '테스트 장비', ... }
- 장비 목록에 즉시 표시
- DB에 장비 데이터 정상 저장

#### 1.3. 시험소 관리자는 장비를 직접 등록할 수 있다

**File:** `apps/frontend/tests/e2e/equipment-create/approval-workflow.spec.ts`

**Steps:**

1. siteAdminPage로 /equipment/create 페이지 이동
2. 권한 배너에서 '현재 권한: 시험소 관리자'와 '직접 처리' 뱃지 확인
3. 필수 정보 입력
4. '등록' 버튼 클릭
5. 승인 확인 모달 없이 바로 처리됨 확인
6. 토스트 메시지 '장비 등록 완료' 확인
7. /equipment 페이지로 리다이렉트 확인
8. GET /api/equipment/{uuid} 호출하여 DB 저장 확인

**Expected Results:**

- 권한 배너에 '시험소 관리자' 및 '직접 처리' 표시
- 승인 모달 없이 바로 등록 처리
- 장비 목록에 즉시 표시
- DB에 장비 데이터 정상 저장

### 2. 일반 장비 등록 - 폼 유효성 검사

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 2.1. 필수 필드 누락 시 유효성 검사 에러 표시

**File:** `apps/frontend/tests/e2e/equipment-create/validation.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 아무 입력 없이 '등록' 버튼 클릭
3. 필수 필드(장비명, 사이트, 팀, 관리번호 일련번호, 모델명, 제조사, 시리얼번호, 현재 위치, 기술책임자)에 에러 메시지 표시 확인
4. 장비명만 입력 후 '등록' 버튼 클릭
5. 나머지 필수 필드에 에러 메시지 유지 확인
6. 모든 필수 필드 입력 후 에러 메시지 사라짐 확인

**Expected Results:**

- 필수 필드에 빨간색 에러 메시지 표시
- 필드 입력 시 해당 에러 메시지 사라짐
- 모든 필수 필드 입력 완료 후 등록 가능

#### 2.2. 관리번호 일련번호 형식 검증

**File:** `apps/frontend/tests/e2e/equipment-create/validation.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 사이트='suwon', 팀 선택
3. 관리번호 일련번호에 'abc' 입력 (비숫자)
4. 에러 메시지 '숫자만 입력 가능합니다' 확인
5. 관리번호 일련번호에 '12345' 입력 (5자리)
6. 에러 메시지 '4자리 숫자를 입력하세요' 확인
7. 관리번호 일련번호에 '0001' 입력 (정상)
8. 에러 메시지 사라짐 확인
9. 관리번호 미리보기에 'SUW-E 0001' 표시 확인

**Expected Results:**

- 비숫자 입력 시 에러 메시지 표시
- 4자리 초과 입력 시 에러 메시지 표시
- 정상 입력 시 관리번호 미리보기 업데이트

#### 2.3. 교정 정보 조건부 필수 필드 검증

**File:** `apps/frontend/tests/e2e/equipment-create/validation.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 관리 방법='외부 교정' 선택
3. 교정 주기, 최종 교정일, 교정 기관 필드 필수로 활성화 확인
4. 교정 주기 없이 등록 시도 시 에러 메시지 확인
5. 관리 방법='자가 교정' 선택
6. 교정 관련 필드 선택 사항으로 변경 확인
7. '중간점검 대상' 체크박스 선택
8. 중간점검 주기, 최종 중간점검일 필드 활성화 확인

**Expected Results:**

- 외부 교정 선택 시 교정 관련 필드 필수
- 자가 교정 선택 시 교정 관련 필드 선택 사항
- 중간점검 대상 선택 시 관련 필드 활성화

#### 2.4. 중복 관리번호 검증

**File:** `apps/frontend/tests/e2e/equipment-create/validation.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 기존에 등록된 장비와 동일한 관리번호 입력
3. '등록' 버튼 클릭
4. API 에러 응답: '이미 존재하는 관리번호입니다' 확인
5. 에러 알림 표시 확인
6. 관리번호 변경 후 재시도
7. 등록 성공 확인

**Expected Results:**

- 중복 관리번호 시 서버 에러 응답
- 사용자 친화적 에러 메시지 표시
- 고유 관리번호 입력 시 등록 성공

### 3. 일반 장비 등록 - 파일 업로드

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 3.1. 검수보고서 파일 업로드 성공

**File:** `apps/frontend/tests/e2e/equipment-create/file-upload.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 파일 첨부 섹션으로 스크롤
4. '파일 선택' 버튼 클릭 또는 드래그 앤 드롭으로 PDF 파일 첨부
5. 업로드된 파일명 표시 확인
6. '등록' 버튼 클릭
7. multipart/form-data 요청 확인
8. 등록 성공 후 GET /api/equipment/{uuid}/attachments 호출
9. 첨부 파일 목록에 업로드된 파일 표시 확인

**Expected Results:**

- 파일 선택 시 파일명 표시
- multipart/form-data로 API 요청 전송
- attachmentType: 'inspection_report' 설정
- DB에 첨부 파일 정보 저장

#### 3.2. 다중 파일 업로드 (최대 10개)

**File:** `apps/frontend/tests/e2e/equipment-create/file-upload.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 5개의 PDF 파일 순차적으로 업로드
4. 업로드된 파일 목록에 5개 파일 표시 확인
5. '등록' 버튼 클릭
6. 모든 파일이 서버에 업로드됨 확인

**Expected Results:**

- 다중 파일 업로드 지원
- 파일 목록에 모든 파일 표시
- 모든 파일 DB에 저장

#### 3.3. 파일 크기 제한 검증 (10MB 초과)

**File:** `apps/frontend/tests/e2e/equipment-create/file-upload.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 15MB 크기의 파일 업로드 시도
3. '파일 크기는 최대 10MB입니다' 에러 메시지 확인
4. 파일이 업로드 목록에 추가되지 않음 확인

**Expected Results:**

- 10MB 초과 파일 거부
- 에러 메시지 표시
- 파일 목록 변경 없음

#### 3.4. 허용되지 않은 파일 형식 검증

**File:** `apps/frontend/tests/e2e/equipment-create/file-upload.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. .exe 파일 업로드 시도
3. '지원하지 않는 파일 형식입니다' 에러 메시지 확인
4. .pdf, .jpg, .png, .doc, .docx, .xls, .xlsx 파일 업로드 성공 확인

**Expected Results:**

- 허용되지 않은 파일 형식 거부
- 허용된 파일 형식만 업로드 가능

### 4. 일반 장비 등록 - 이력 데이터 병렬 저장

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 4.1. 위치 변동 이력과 함께 장비 등록

**File:** `apps/frontend/tests/e2e/equipment-create/history-save.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 위치 변동 이력 섹션에서 '추가' 버튼 클릭
4. 이력 입력 모달에서 변경일자, 새 위치, 메모 입력
5. '저장' 버튼 클릭
6. 이력 목록에 항목 추가 확인 (tempId로 관리됨)
7. 추가로 2개 더 이력 추가
8. '등록' 버튼 클릭
9. 장비 등록 + 이력 3건 병렬 저장 확인
10. 토스트 메시지 '장비 등록 완료 (이력 3건 저장됨)' 확인
11. GET /api/equipment/{uuid}/location-history 호출하여 3건 확인

**Expected Results:**

- 임시 이력 항목에 tempId 부여
- 장비 등록 시 Promise.all로 이력 병렬 저장
- 모든 이력 DB에 저장
- 저장된 이력 개수 토스트에 표시

#### 4.2. 다양한 이력 유형 병렬 저장

**File:** `apps/frontend/tests/e2e/equipment-create/history-save.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 위치 변동 이력 2건 추가
4. 유지보수 내역 1건 추가
5. 손상/수리 내역 1건 추가
6. 교정 이력 1건 추가
7. '등록' 버튼 클릭
8. 장비 등록 + 이력 5건 병렬 저장 확인
9. 각 이력 유형별 API 호출 확인

**Expected Results:**

- 4가지 이력 유형 모두 병렬 저장
- Promise.all 사용으로 성능 최적화
- 각 이력 유형별 DB 저장 확인

#### 4.3. 이력 부분 실패 시 에러 처리

**File:** `apps/frontend/tests/e2e/equipment-create/history-save.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 위치 변동 이력 3건 추가 (1건은 유효하지 않은 데이터)
4. '등록' 버튼 클릭
5. 장비 등록 성공
6. 이력 저장: 2건 성공, 1건 실패
7. 부분 성공 알림 표시: '장비 등록 완료. 이력 2/3건 저장 완료.'
8. 실패한 이력 항목 표시 확인
9. 5초 후 /equipment 페이지로 이동

**Expected Results:**

- 장비 등록은 성공
- 이력 부분 실패 시 PartialSuccessAlert 표시
- 실패 항목 상세 정보 표시
- 일정 시간 후 자동 리다이렉트

#### 4.4. 임시 이력 삭제 후 등록

**File:** `apps/frontend/tests/e2e/equipment-create/history-save.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 위치 변동 이력 3건 추가
4. 2번째 이력 항목의 '삭제' 버튼 클릭
5. 이력 목록에서 2건만 표시 확인
6. '등록' 버튼 클릭
7. 이력 2건만 저장됨 확인 (삭제된 항목 제외)

**Expected Results:**

- tempId 기반 안전한 삭제
- 삭제된 항목은 pendingHistory에서 제거
- 등록 시 남은 항목만 저장

### 5. 공용/렌탈 장비 임시등록 - 기본 기능

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 5.1. 공용장비 임시등록 성공

**File:** `apps/frontend/tests/e2e/equipment-create/shared-equipment.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 임시등록 안내 Alert 표시 확인
3. 장비 유형: '공용장비 (타 팀)' 라디오 버튼 선택 (기본값)
4. 소유처 드롭다운에서 'Safety팀' 선택
5. 사용 시작일, 사용 종료일 입력
6. 교정성적서 PDF 파일 업로드 (필수)
7. 기본 정보 (장비명, 사이트, 팀, 관리번호 등) 입력
8. 교정 정보 입력 후 차기 교정일 > 사용 종료일 확인
9. '등록' 버튼 클릭
10. POST /api/equipment/shared API 호출 확인
11. 토스트 메시지 '임시등록 완료' 확인
12. /equipment/{uuid} 상세 페이지로 리다이렉트 확인

**Expected Results:**

- equipmentType: 'common' 설정
- sharedSource: 'safety_lab' 설정
- status: 'temporary' 자동 설정
- isShared: true 자동 설정
- DB에 공용장비 데이터 저장

#### 5.2. 렌탈장비 임시등록 성공

**File:** `apps/frontend/tests/e2e/equipment-create/shared-equipment.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 장비 유형: '렌탈장비 (외부)' 라디오 버튼 선택
3. 소유처 입력 필드로 변경 확인 (드롭다운 → 텍스트 입력)
4. 소유처에 '한국계측기렌탈' 입력
5. 소유처 원본 식별번호에 'RNT-2024-001' 입력
6. 사용 기간 입력
7. 교정성적서 PDF 업로드
8. 기본 정보 및 교정 정보 입력
9. '등록' 버튼 클릭
10. API 응답 확인

**Expected Results:**

- equipmentType: 'rental' 설정
- sharedSource: 'external' 설정
- owner: '한국계측기렌탈' 저장
- externalIdentifier: 'RNT-2024-001' 저장
- status: 'temporary' 자동 설정

#### 5.3. 교정 유효성 자동 검증 - 경고 표시

**File:** `apps/frontend/tests/e2e/equipment-create/shared-equipment.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 장비 유형, 소유처 선택
3. 사용 종료일: 2025-06-30 입력
4. 차기 교정 예정일: 2025-03-15 입력 (사용 종료일보다 이전)
5. CalibrationValidityChecker 컴포넌트에 경고 표시 확인
6. 경고 메시지: '교정 유효기간이 사용 기간 내에 만료됩니다' 확인

**Expected Results:**

- nextCalibrationDate < usagePeriodEnd 시 경고 표시
- 경고 아이콘 및 메시지 표시
- 등록은 가능하지만 사용자에게 경고 제공

#### 5.4. 교정 유효성 자동 검증 - 유효

**File:** `apps/frontend/tests/e2e/equipment-create/shared-equipment.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 사용 종료일: 2025-06-30 입력
3. 차기 교정 예정일: 2025-12-31 입력 (사용 종료일보다 이후)
4. CalibrationValidityChecker에 '교정 유효기간 충분' 메시지 확인
5. 녹색 체크 아이콘 표시 확인

**Expected Results:**

- nextCalibrationDate > usagePeriodEnd 시 유효 표시
- 녹색 체크 아이콘 및 메시지 표시

#### 5.5. 교정성적서 필수 업로드 검증

**File:** `apps/frontend/tests/e2e/equipment-create/shared-equipment.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 모든 필수 정보 입력 (교정성적서 제외)
3. '등록' 버튼 클릭
4. 교정성적서 필드에 '필수 항목입니다' 에러 메시지 확인
5. PDF 파일 업로드
6. 에러 메시지 사라짐 확인
7. '등록' 버튼 클릭
8. 등록 성공 확인

**Expected Results:**

- 교정성적서 없이 등록 불가
- PDF 파일만 허용
- 업로드 후 등록 가능

### 6. 공용/렌탈 장비 임시등록 - 역할별 동작

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 6.1. 시험실무자도 공용/렌탈 장비를 임시등록할 수 있다

**File:** `apps/frontend/tests/e2e/equipment-create/shared-role-workflow.spec.ts`

**Steps:**

1. testOperatorPage로 /equipment/create-shared 페이지 이동
2. 권한 배너 확인 (공용장비는 승인 프로세스 상이)
3. 필수 정보 및 교정성적서 업로드
4. '등록' 버튼 클릭
5. POST /api/equipment/shared API 호출 확인
6. 등록 성공 확인 (승인 없이 바로 등록)

**Expected Results:**

- 공용/렌탈 장비는 승인 프로세스 없음
- 시험실무자도 직접 등록 가능
- status: 'temporary'로 등록

#### 6.2. 일반 장비 등록 페이지에서 공용장비 등록 링크 확인

**File:** `apps/frontend/tests/e2e/equipment-create/shared-role-workflow.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 헤더 영역에 '공용장비 등록' 버튼 확인
3. '공용장비 등록' 버튼 클릭
4. /equipment/create-shared 페이지로 이동 확인

**Expected Results:**

- 일반 등록 페이지에서 공용장비 등록 링크 제공
- 클릭 시 공용장비 등록 페이지로 이동

### 7. 에러 처리 및 네트워크 에러

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 7.1. API 에러 발생 시 사용자 친화적 에러 메시지 표시

**File:** `apps/frontend/tests/e2e/equipment-create/error-handling.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. API 응답 모킹: 500 Internal Server Error
4. '등록' 버튼 클릭
5. ErrorAlert 컴포넌트 표시 확인
6. 에러 메시지 및 해결 방법 표시 확인
7. '다시 시도' 버튼 클릭으로 에러 상태 초기화 확인

**Expected Results:**

- 서버 에러 시 ErrorAlert 표시
- 사용자 친화적 메시지 및 해결 방법 제공
- 다시 시도 가능

#### 7.2. 네트워크 타임아웃 에러 처리

**File:** `apps/frontend/tests/e2e/equipment-create/error-handling.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 네트워크 요청 지연 모킹 (30초 이상)
4. '등록' 버튼 클릭
5. 로딩 상태 표시 확인 ('처리 중...')
6. 타임아웃 에러 발생
7. '네트워크 연결을 확인해주세요' 에러 메시지 확인

**Expected Results:**

- 로딩 상태 표시
- 타임아웃 시 에러 메시지 표시
- 재시도 가능

#### 7.3. 권한 없음 에러 처리 (403 Forbidden)

**File:** `apps/frontend/tests/e2e/equipment-create/error-handling.spec.ts`

**Steps:**

1. API 응답 모킹: 403 Forbidden
2. '등록' 버튼 클릭
3. '권한이 없습니다. 관리자에게 문의하세요.' 에러 메시지 확인

**Expected Results:**

- 403 에러 시 권한 관련 메시지 표시
- 관리자 문의 안내

### 8. UI/UX 및 접근성

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 8.1. 폼 섹션 순차 표시 및 스크롤 동작

**File:** `apps/frontend/tests/e2e/equipment-create/accessibility.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 섹션 순서 확인: 1.기본정보 → 2.교정정보 → 3.상태및위치 → 4.파일첨부 → 이력관리
3. 각 섹션에 번호 뱃지 표시 확인
4. 페이지 하단으로 스크롤 시 모든 섹션 접근 가능 확인

**Expected Results:**

- 섹션이 논리적 순서로 배치
- 번호 뱃지로 진행 상태 표시
- 모든 섹션 접근 가능

#### 8.2. 키보드 네비게이션

**File:** `apps/frontend/tests/e2e/equipment-create/accessibility.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. Tab 키로 폼 필드 간 이동 확인
3. Enter 키로 드롭다운 열기/닫기 확인
4. Escape 키로 모달 닫기 확인
5. Tab 순서가 논리적인지 확인

**Expected Results:**

- Tab 키로 모든 폼 요소 접근 가능
- 키보드만으로 폼 작성 가능
- 포커스 표시자 명확

#### 8.3. 취소 버튼 클릭 시 이전 페이지로 이동

**File:** `apps/frontend/tests/e2e/equipment-create/accessibility.spec.ts`

**Steps:**

1. techManagerPage로 /equipment 페이지에서 '등록' 버튼 클릭
2. /equipment/create 페이지로 이동 확인
3. 일부 정보 입력
4. '취소' 버튼 클릭
5. /equipment 페이지로 돌아감 확인

**Expected Results:**

- 취소 버튼 클릭 시 /equipment 페이지로 이동
- 입력 데이터 저장 안 됨

#### 8.4. 뒤로 가기 버튼 동작

**File:** `apps/frontend/tests/e2e/equipment-create/accessibility.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 헤더의 뒤로 가기 버튼 (ArrowLeft 아이콘) 클릭
3. /equipment 페이지로 이동 확인

**Expected Results:**

- 뒤로 가기 버튼으로 장비 목록 페이지 이동

### 9. DB 검증 통합 테스트

**Seed:** `apps/frontend/tests/e2e/equipment-create/seed.spec.ts`

#### 9.1. 장비 등록 후 DB 데이터 검증

**File:** `apps/frontend/tests/e2e/equipment-create/db-verification.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 테스트 데이터 입력: name='DB검증테스트장비', managementNumber='SUW-E 9999'
3. 교정 정보, 상태/위치 정보 입력
4. '등록' 버튼 클릭
5. API 응답에서 uuid 추출
6. GET /api/equipment/{uuid} API 호출
7. 응답 데이터와 입력 데이터 비교 검증
8. name, managementNumber, site, status 등 주요 필드 일치 확인

**Expected Results:**

- DB에 저장된 데이터와 입력 데이터 일치
- 모든 필드 정상 저장
- 날짜 필드 ISO 형식 저장

#### 9.2. 이력 데이터 DB 저장 검증

**File:** `apps/frontend/tests/e2e/equipment-create/db-verification.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. 위치 변동 이력 추가: newLocation='RF1 Room', notes='초기 설치'
4. '등록' 버튼 클릭
5. uuid 추출
6. GET /api/equipment/{uuid}/location-history API 호출
7. 이력 데이터 검증: newLocation, notes 일치 확인

**Expected Results:**

- 이력 데이터 DB 정상 저장
- equipmentId 연결 확인
- 생성 일시 자동 설정

#### 9.3. 공용장비 등록 후 DB 데이터 검증

**File:** `apps/frontend/tests/e2e/equipment-create/db-verification.spec.ts`

**Steps:**

1. techManagerPage로 /equipment/create-shared 페이지 이동
2. 공용장비 정보 입력
3. '등록' 버튼 클릭
4. uuid 추출
5. GET /api/equipment/{uuid} API 호출
6. isShared: true, sharedSource: 'safety_lab', status: 'temporary' 확인
7. owner, usagePeriodStart, usagePeriodEnd 필드 확인

**Expected Results:**

- 공용장비 전용 필드 DB 저장
- isShared: true 설정
- status: 'temporary' 설정

#### 9.4. 승인 요청 DB 저장 검증 (시험실무자)

**File:** `apps/frontend/tests/e2e/equipment-create/db-verification.spec.ts`

**Steps:**

1. testOperatorPage로 /equipment/create 페이지 이동
2. 필수 정보 입력
3. '등록 (승인 요청)' 버튼 클릭
4. 승인 모달에서 '요청하기' 클릭
5. API 응답에서 requestUuid 추출
6. GET /api/equipment/requests/{requestUuid} API 호출
7. requestType: 'create', approvalStatus: 'pending_approval' 확인
8. requestData에 입력 데이터 JSON 저장 확인

**Expected Results:**

- 승인 요청 테이블에 데이터 저장
- requestType: 'create'
- approvalStatus: 'pending_approval'
- requestedBy에 사용자 ID 저장
