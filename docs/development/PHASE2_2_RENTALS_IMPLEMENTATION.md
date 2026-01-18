# Phase 2.2: 장비 대여 및 반출 관리 구현 계획

## 개요

장비 대여(rentals) 및 반출(checkouts) 기능을 구현합니다. reservations 모듈은 제거하고 rentals와 checkouts만 사용합니다.

## 요구사항

### 1. 대여 (Rentals) - 같은 시험소 내 다른 팀 장비 사용

- **승인 단계**: 1단계 프로세스
  - 신청: 모든 사용자(일반/담당자/매니저/관리자)가 신청 가능
  - 승인: 장비 소유 팀의 담당자 또는 매니저가 승인/반려

### 2. 반출 (Checkouts) - 시험소 외부로 이동

- **내부 목적(교정/수리) 반출**:
  - 신청: 장비 담당자만 신청 가능
  - 승인: 해당 팀의 팀 매니저가 승인/반려 (1단계)
- **외부 대여 목적 반출** (예: 수원랩→의왕랩):
  - 신청: 빌리는 측 장비 담당자가 신청
  - 1차 승인: 빌려주는 측 장비 담당자가 승인/반려
  - 최종 승인: 빌려주는 측 팀 매니저가 승인/반려 (2단계)

### 3. 공통 규칙

- 반려 시 사유 필수: 모든 반려에는 반드시 사유를 기재해야 함
- 다중 승인자 처리: 동일 권한의 승인자가 여럿일 경우 선착순으로 처리
- 요청 취소: 승인 전 신청자는 요청을 취소할 수 있음
- 승인 후 처리: 최종 승인된 요청은 수정/취소가 불가

### 4. 반입 관리

- 외부로 교정/수리가 나간 경우 반입되었을 때 교정 여부를 확인
- 수리 후 작동 여부 등을 확인하는 반입 과정 필요
- 시험소간 대여를 하는 경우에도 교정 여부/정상 작동 여부에 대한 상호 확인 과정 필요
- 반입 과정의 최종 승인도 기술책임자가 수행

## 구현 계획

### Step 1: Rentals 모듈 DB 기반 전환 ✅ 완료

- [x] rentals.service.ts를 Equipment 모듈과 동일한 표준으로 재작성
- [x] loans 테이블 사용 (Drizzle ORM)
- [x] EquipmentService 의존성 추가
- [x] Logger, 에러 처리, 헬퍼 메서드 등 Equipment 모듈 패턴 적용
- [x] 1단계 승인 프로세스 구현
- [x] 반려 사유 필수 검증
- [x] 데이터베이스 마이그레이션 완료
- [x] E2E 테스트 작성 및 통과 (10/10)

### Step 2: Checkouts 모듈 구현

- [ ] checkouts 모듈 생성 (서비스, 컨트롤러)
- [ ] checkouts 테이블 스키마 확인 및 필요시 수정
- [ ] 내부 목적 반출 (1단계 승인)
- [ ] 외부 대여 목적 반출 (2단계 승인)
- [ ] 반입 관리 기능 추가

### Step 3: 승인 프로세스 구현

- [ ] 승인자 권한 확인 로직
- [ ] 다중 승인자 선착순 처리
- [ ] 승인 상태 관리
- [ ] 반려 사유 필수 검증

### Step 4: 반입 관리 기능

- [ ] 반입 기록 생성
- [ ] 교정 여부 확인
- [ ] 작동 여부 확인
- [ ] 기술책임자 최종 승인

### Step 5: Reservations 모듈 제거

- [ ] reservations 모듈 삭제
- [ ] 관련 import 제거
- [ ] app.module.ts에서 ReservationsModule 제거

### Step 6: 테스트 작성

- [x] Rentals E2E 테스트 ✅ (10/10 통과)
- [ ] Checkouts E2E 테스트 (5개 실패, 8개 통과 - 수정 필요)
- [x] 승인 프로세스 테스트 ✅ (Rentals)
- [ ] 반입 관리 테스트

## 데이터베이스 스키마

### loans 테이블 (대여)

- id: UUID (PK)
- equipmentId: UUID (FK)
- borrowerId: UUID (FK) - 대여 신청자
- approverId: UUID (FK) - 승인자
- status: varchar - 'pending' | 'active' | 'returned' | 'overdue'
- loanDate: timestamp - 실제 대여 시작일
- expectedReturnDate: timestamp - 예상 반납일
- actualReturnDate: timestamp - 실제 반납일
- notes: text - 비고
- rejectionReason: text - 반려 사유 (반려 시 필수)

### checkouts 테이블 (반출)

- id: UUID (PK)
- requesterId: UUID (FK) - 신청자
- firstApproverId: UUID (FK) - 1차 승인자 (외부 대여 시)
- finalApproverId: UUID (FK) - 최종 승인자
- status: varchar - 'pending' | 'first_approved' | 'final_approved' | 'rejected' | 'checked_out' | 'returned'
- purpose: varchar - 'calibration' | 'repair' | 'external_rental'
- destination: varchar - 반출 목적지
- checkoutDate: timestamp - 실제 반출일
- expectedReturnDate: timestamp - 예상 반입일
- actualReturnDate: timestamp - 실제 반입일
- rejectionReason: text - 반려 사유

### checkout_items 테이블 (반출 장비 목록)

- id: UUID (PK)
- checkoutId: UUID (FK)
- equipmentId: UUID (FK)
- quantity: integer

### return_inspections 테이블 (반입 검사)

- id: UUID (PK)
- checkoutId: UUID (FK)
- inspectorId: UUID (FK) - 검사자
- calibrationChecked: boolean - 교정 여부 확인
- workingCondition: boolean - 작동 여부 확인
- inspectionNotes: text - 검사 비고
- finalApproverId: UUID (FK) - 최종 승인자 (기술책임자)
- inspectionDate: timestamp

## API 엔드포인트

### Rentals (대여)

- POST /rentals - 대여 신청
- GET /rentals - 대여 목록 조회
- GET /rentals/:id - 대여 상세 조회
- PATCH /rentals/:id/approve - 대여 승인
- PATCH /rentals/:id/reject - 대여 반려 (사유 필수)
- PATCH /rentals/:id/cancel - 대여 취소 (승인 전만 가능)
- PATCH /rentals/:id/complete - 대여 완료 (반납)

### Checkouts (반출)

- POST /checkouts - 반출 신청
- GET /checkouts - 반출 목록 조회
- GET /checkouts/:id - 반출 상세 조회
- PATCH /checkouts/:id/first-approve - 1차 승인 (외부 대여만)
- PATCH /checkouts/:id/final-approve - 최종 승인
- PATCH /checkouts/:id/reject - 반출 반려 (사유 필수)
- PATCH /checkouts/:id/cancel - 반출 취소 (승인 전만 가능)
- POST /checkouts/:id/return - 반입 처리
- POST /checkouts/:id/inspection - 반입 검사
- PATCH /checkouts/:id/approve-inspection - 반입 검사 최종 승인

## 완료 상태

### ✅ 완료된 작업

- **Step 1: Rentals 모듈 DB 기반 전환** - 완료 (2026-01-16)
- **Step 6: Rentals E2E 테스트** - 완료 (10/10 통과)

자세한 내용은 [PHASE2_2_RENTALS_COMPLETE.md](./PHASE2_2_RENTALS_COMPLETE.md)를 참조하세요.

## 다음 단계

### Phase 2.3: Checkouts 모듈 테스트 수정 및 프론트엔드 구현

1. **Checkouts E2E 테스트 수정** (우선순위: 높음)

   - 현재 5개 테스트 실패
   - Rentals와 동일한 패턴으로 수정
   - `findOne` 메서드 개선 필요

2. **프론트엔드 Rentals 구현**

   - 대여 신청 페이지
   - 대여 목록 페이지
   - 대여 상세 페이지
   - 승인/반려 UI

3. **프론트엔드 Checkouts 구현**
   - 반출 신청 페이지
   - 반출 목록 페이지
   - 반출 상세 페이지
   - 2단계 승인 UI
