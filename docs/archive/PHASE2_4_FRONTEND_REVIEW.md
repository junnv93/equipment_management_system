# Phase 2.4: 프론트엔드 Rentals/Checkouts 구현 상태 검토 및 개선 계획

**검토일**: 2026-01-16  
**상태**: 검토 완료, 대부분 개선 완료 (상세 페이지 제외)

---

## 🔍 검토 결과 요약

### ✅ 완료된 부분

1. **프론트엔드 Rentals**

   - ✅ 목록 페이지 존재 및 수정 완료 (`/rentals/page.tsx`)
   - ✅ 신청 페이지 존재 및 수정 완료 (`/rentals/create/page.tsx`)
   - ✅ 관리 페이지 존재 및 수정 완료 (`/rentals/manage/page.tsx`)
   - ✅ API 클라이언트 존재 및 백엔드 API에 맞게 수정 완료 (`lib/api/rental-api.ts`)

2. **프론트엔드 Checkouts**
   - ✅ 목록 페이지 존재 및 수정 완료 (`/checkouts/page.tsx`)
   - ✅ 신청 페이지 존재 및 수정 완료 (`/checkouts/create/page.tsx`)
   - ✅ 관리 페이지 존재 및 수정 완료 (`/checkouts/manage/page.tsx`)
   - ✅ API 클라이언트 존재 및 백엔드 API에 맞게 수정 완료 (`lib/api/checkout-api.ts`)

### ❌ 발견된 문제점 (근본적 해결 필요)

#### 1. API 엔드포인트 불일치 (심각)

**Rentals API 불일치**:

| 기능      | 프론트엔드                       | 백엔드                              | 상태      |
| --------- | -------------------------------- | ----------------------------------- | --------- |
| 승인      | `POST /api/rentals/:id/approve`  | `PATCH /api/rentals/:uuid/approve`  | ❌ 불일치 |
| 반려      | `POST /api/rentals/:id/reject`   | `PATCH /api/rentals/:uuid/reject`   | ❌ 불일치 |
| 반납      | `POST /api/rentals/:id/return`   | `PATCH /api/rentals/:uuid/complete` | ❌ 불일치 |
| 요약      | `GET /api/rentals/summary`       | 존재하지 않음                       | ❌ 없음   |
| 기한 초과 | `GET /api/rentals/overdue`       | 존재하지 않음                       | ❌ 없음   |
| 오늘 반납 | `GET /api/rentals/today-returns` | 존재하지 않음                       | ❌ 없음   |

**Checkouts API 불일치**:

| 기능      | 프론트엔드                         | 백엔드                                                                                   | 상태      |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| 승인      | `POST /api/checkouts/:id/approve`  | `PATCH /api/checkouts/:uuid/approve-first`<br>`PATCH /api/checkouts/:uuid/approve-final` | ❌ 불일치 |
| 반려      | `POST /api/checkouts/:id/reject`   | `PATCH /api/checkouts/:uuid/reject`                                                      | ❌ 불일치 |
| 요약      | `GET /api/checkouts/summary`       | 존재하지 않음                                                                            | ❌ 없음   |
| 기한 초과 | `GET /api/checkouts/overdue`       | 존재하지 않음                                                                            | ❌ 없음   |
| 오늘 반납 | `GET /api/checkouts/today-returns` | 존재하지 않음                                                                            | ❌ 없음   |

#### 2. DTO 구조 불일치 (심각)

**Rentals CreateRentalDto**:

| 필드               | 프론트엔드   | 백엔드                  | 상태             |
| ------------------ | ------------ | ----------------------- | ---------------- |
| userId             | 없음         | 필수                    | ❌ 누락          |
| startDate          | `yyyy-MM-dd` | ISO 형식 (선택)         | ⚠️ 형식 불일치   |
| expectedReturnDate | `yyyy-MM-dd` | `expectedEndDate` (ISO) | ❌ 필드명 불일치 |
| location           | 없음         | 선택                    | ⚠️ 누락 가능     |

**Checkouts CreateCheckoutDto**:

| 필드          | 프론트엔드 | 백엔드           | 상태             |
| ------------- | ---------- | ---------------- | ---------------- |
| location      | 있음       | `destination`    | ❌ 필드명 불일치 |
| contactNumber | 있음       | `phoneNumber`    | ❌ 필드명 불일치 |
| startDate     | 있음       | 없음 (자동 설정) | ❌ 불필요        |
| reason        | 없음       | 필수             | ❌ 누락          |

#### 3. 응답 구조 불일치

**백엔드 응답 구조**:

- 목록: `{ items: [], meta: { pagination: {...} } }`
- 단일: `{ data: {...} }`

**프론트엔드 기대 구조**:

- 목록: `{ data: [], meta: { pagination: {...} } }`
- 단일: `response.data.data`

#### 4. 누락된 페이지 (남은 작업)

- ❌ `/rentals/[uuid]/page.tsx` - 대여 상세 페이지 없음 (구현 필요)
- ❌ `/checkouts/[uuid]/page.tsx` - 반출 상세 페이지 없음 (구현 필요)

#### 5. API 클라이언트 메서드 시그니처 불일치

**Rentals**:

- `approveRental(id, notes?)` - 백엔드는 `approverId` 필수
- `rejectRental(id, reason)` - 백엔드는 `approverId` 필수

**Checkouts**:

- `approveCheckout(id, notes?)` - 백엔드는 2단계 승인 (`approve-first`, `approve-final`)
- `rejectCheckout(id, reason)` - 백엔드는 `approverId` 필수

---

## 🎯 근본적 해결 방안

### 1. API 클라이언트 완전 재작성 (우선순위: 최상)

**원칙**: 백엔드 API를 Single Source of Truth로 사용

#### Rentals API 클라이언트 수정

```typescript
// lib/api/rental-api.ts 개선 사항

1. approveRental 수정
   - POST → PATCH
   - approverId 파라미터 추가 (필수)
   - notes 제거 (백엔드에 없음)

2. rejectRental 수정
   - POST → PATCH
   - approverId 파라미터 추가 (필수)

3. returnRental 제거
   - complete 메서드로 대체
   - PATCH /api/rentals/:uuid/complete

4. getRentalSummary 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음
   - 필요시 백엔드에 구현 요청

5. getOverdueRentals 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음
   - findAll에 필터로 처리 가능

6. getTodayReturns 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음
   - findAll에 필터로 처리 가능

7. CreateRentalDto 수정
   - userId 추가 (JWT에서 가져오거나 파라미터로 받기)
   - expectedReturnDate → expectedEndDate
   - startDate 형식: ISO 문자열
   - location 추가 (선택)
```

#### Checkouts API 클라이언트 수정

```typescript
// lib/api/checkout-api.ts 개선 사항

1. approveCheckout 제거
   - approveFirst, approveFinal로 분리
   - 각각 approverId 필수

2. rejectCheckout 수정
   - POST → PATCH
   - approverId 파라미터 추가 (필수)

3. CreateCheckoutDto 수정
   - location → destination
   - contactNumber → phoneNumber
   - startDate 제거 (백엔드에서 자동 설정)
   - reason 추가 (필수)
   - address 추가 (선택)

4. getCheckoutSummary 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음

5. getOverdueCheckouts 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음

6. getTodayReturns 제거 또는 백엔드 구현
   - 백엔드에 엔드포인트 없음
```

### 2. 응답 구조 통일

**백엔드 응답 구조를 기준으로 프론트엔드 수정**:

```typescript
// 목록 응답 처리
const response = await axios.get('/api/rentals');
// 백엔드: { items: [], meta: { pagination: {...} } }
// 프론트엔드 수정: response.data.items, response.data.meta

// 단일 응답 처리
const response = await axios.get('/api/rentals/:uuid');
// 백엔드: { data: {...} }
// 프론트엔드 수정: response.data.data
```

### 3. 상세 페이지 구현

**Equipment 상세 페이지 패턴을 따라 구현**:

- `/rentals/[uuid]/page.tsx` 생성
- `/checkouts/[uuid]/page.tsx` 생성
- Equipment 상세 페이지와 동일한 구조 및 스타일

### 4. 폼 페이지 수정

**Rentals 신청 폼**:

- userId 추가 (JWT에서 자동 가져오기)
- expectedReturnDate → expectedEndDate
- 날짜 형식: ISO 문자열
- location 필드 추가

**Checkouts 신청 폼**:

- location → destination
- contactNumber → phoneNumber
- startDate 제거
- reason 필드 추가 (필수)
- address 필드 추가

---

## 📋 상세 개선 작업 체크리스트

### ✅ Phase 2.4.1: API 클라이언트 수정 (완료)

#### Rentals API 클라이언트

- [x] `approveRental` 메서드 수정 (POST → PATCH, approverId 추가)
- [x] `rejectRental` 메서드 수정 (POST → PATCH, approverId 추가)
- [x] `returnRental` 제거, `completeRental` 추가
- [x] `getRentalSummary` 제거 또는 백엔드 구현 (findAll로 대체)
- [x] `getOverdueRentals` 제거 또는 백엔드 구현 (findAll 필터로 대체)
- [x] `getTodayReturns` 제거 또는 백엔드 구현 (findAll 필터로 대체)
- [x] `CreateRentalDto` 인터페이스 수정
- [x] 응답 구조 처리 수정 (items, meta)

#### Checkouts API 클라이언트

- [x] `approveCheckout` 제거, `approveFirst`, `approveFinal` 추가
- [x] `rejectCheckout` 메서드 수정 (POST → PATCH, approverId 추가)
- [x] `CreateCheckoutDto` 인터페이스 수정
- [x] `getCheckoutSummary` 제거 또는 백엔드 구현 (findAll로 대체)
- [x] `getOverdueCheckouts` 제거 또는 백엔드 구현 (findAll 필터로 대체)
- [x] `getTodayReturns` 제거 또는 백엔드 구현 (findAll 필터로 대체)
- [x] 응답 구조 처리 수정 (items, meta)
- [x] `Checkout` 인터페이스 수정 (백엔드 필드명 반영)

### ✅ Phase 2.4.2: 폼 페이지 수정 (완료)

#### Rentals 신청 폼

- [x] userId 자동 처리 (백엔드에서 JWT에서 가져오기)
- [x] expectedReturnDate → expectedEndDate 필드명 변경
- [x] 날짜 형식: ISO 문자열로 변경

#### Checkouts 신청 폼

- [x] location → destination 필드명 변경
- [x] contactNumber → phoneNumber 필드명 변경
- [x] startDate 필드 제거
- [x] reason 필드 추가 (필수)
- [x] address 필드 추가 (선택)
- [x] purpose를 Select로 변경 (calibration, repair, external_rental)

### Phase 2.4.3: 상세 페이지 구현 (진행 필요)

#### Rentals 상세 페이지

- [ ] `/rentals/[uuid]/page.tsx` 생성
- [ ] Equipment 상세 페이지 패턴 적용
- [ ] 승인/반려 버튼 (권한에 따라)
- [ ] 취소 버튼 (승인 전만)
- [ ] 반납 처리 버튼

#### Checkouts 상세 페이지

- [ ] `/checkouts/[uuid]/page.tsx` 생성
- [ ] Equipment 상세 페이지 패턴 적용
- [ ] 반출된 장비 목록 표시
- [ ] 1차/최종 승인 버튼 (권한에 따라)
- [ ] 반려 버튼 (사유 필수)
- [ ] 반입 처리 버튼

### ✅ Phase 2.4.4: 목록 페이지 수정 (완료)

#### Rentals 목록 페이지

- [x] 응답 구조 수정 (items, meta)
- [x] 존재하지 않는 API 호출 제거 (summary, overdue, today-returns → findAll 필터로 대체)

#### Checkouts 목록 페이지

- [x] 응답 구조 수정 (items, meta)
- [x] 존재하지 않는 API 호출 제거 (summary, overdue, today-returns → findAll 필터로 대체)
- [x] 필드명 수정 (location → destination)

### ✅ Phase 2.4.5: 관리 페이지 수정 (완료)

#### Rentals 관리 페이지

- [x] approveRental 호출 수정 (PATCH, approverId 추가)
- [x] rejectRental 호출 수정 (PATCH, approverId 추가)
- [x] returnRental → completeRental 변경
- [x] useAuth 훅 추가 (JWT에서 사용자 ID 가져오기)

#### Checkouts 관리 페이지

- [x] approveCheckout → approveFirst/approveFinal로 변경
- [x] rejectCheckout 호출 수정 (PATCH, approverId 추가)
- [x] 목적에 따른 1차/최종 승인 분리
- [x] useAuth 훅 추가 (JWT에서 사용자 ID 가져오기)
- [x] 필드명 수정 (location → destination, startDate → checkoutDate)

---

## 🔧 근본적 해결 원칙

### 1. Single Source of Truth

- **백엔드 API를 기준으로 프론트엔드 수정**
- 프론트엔드에서 백엔드 API를 변경하려고 하지 않음
- 백엔드 API가 없는 기능은 제거하거나 백엔드에 구현 요청

### 2. 일관성

- Equipment 모듈과 동일한 패턴 적용
- API 클라이언트 구조 통일
- 응답 처리 로직 통일

### 3. 타입 안전성

- 백엔드 DTO와 프론트엔드 인터페이스 일치
- Zod 스키마 활용 (필요시)

### 4. 에러 처리

- 백엔드 에러 응답 구조에 맞게 처리
- 명확한 에러 메시지 표시

---

## 📊 우선순위

### ✅ 즉시 수정 필요 (P0) - 완료

1. ✅ API 클라이언트 엔드포인트 수정 (POST → PATCH)
2. ✅ DTO 구조 수정 (필드명, 필수 필드)
3. ✅ 응답 구조 처리 수정

### ✅ 단기 개선 (P1) - 완료

4. ✅ 폼 페이지 수정
5. ✅ 관리 페이지 수정
6. ✅ 목록 페이지 개선
7. ✅ 존재하지 않는 API 호출 제거 또는 백엔드 구현

### 진행 필요 (P1)

8. ⚠️ 상세 페이지 구현 (Rentals, Checkouts)

---

## 🎯 예상 소요 시간

- **Phase 2.4.1 (API 클라이언트)**: ✅ 완료 (약 2시간)
- **Phase 2.4.2 (폼 페이지)**: ✅ 완료 (약 1시간)
- **Phase 2.4.3 (상세 페이지)**: 진행 필요 (예상 3-4시간)
- **Phase 2.4.4 (목록 페이지)**: ✅ 완료 (약 1시간)
- **Phase 2.4.5 (관리 페이지)**: ✅ 완료 (약 1시간)

**완료된 작업**: 약 5시간  
**남은 작업**: 상세 페이지 구현 (예상 3-4시간)

---

## 📝 참고 사항

1. **백엔드 API가 없는 기능**:

   - `/api/rentals/summary` - 필요시 백엔드에 구현 요청
   - `/api/rentals/overdue` - findAll에 필터로 처리 가능
   - `/api/rentals/today-returns` - findAll에 필터로 처리 가능
   - `/api/checkouts/summary` - 필요시 백엔드에 구현 요청
   - `/api/checkouts/overdue` - findAll에 필터로 처리 가능
   - `/api/checkouts/today-returns` - findAll에 필터로 처리 가능

2. **JWT에서 사용자 ID 가져오기**:

   - Rentals/Checkouts 생성 시 userId는 JWT에서 자동으로 가져와야 함
   - 프론트엔드에서 userId를 직접 입력하지 않음

3. **Equipment 모듈 패턴 준수**:
   - Equipment 상세 페이지와 동일한 구조
   - Equipment 폼과 동일한 검증 및 에러 처리

---

## ✅ 완료된 작업 요약

### 백엔드 개선

- ✅ RentalsController.create: JWT에서 userId 자동 가져오기 (Checkouts와 일관성)
- ✅ RentalsController.approve: approverId를 JWT에서 가져올 수 있도록 개선
- ✅ RentalsController.reject: approverId를 JWT에서 가져올 수 있도록 개선
- ✅ CreateRentalDto: userId를 선택 필드로 변경 (서버에서 자동 설정)

### 프론트엔드 API 클라이언트

- ✅ Rentals API 클라이언트 완전 수정
- ✅ Checkouts API 클라이언트 완전 수정
- ✅ 응답 구조 통일 (items, meta)
- ✅ DTO 인터페이스 수정

### 프론트엔드 페이지

- ✅ Rentals 신청 폼 수정
- ✅ Checkouts 신청 폼 수정
- ✅ Rentals 목록 페이지 수정
- ✅ Checkouts 목록 페이지 수정
- ✅ Rentals 관리 페이지 수정
- ✅ Checkouts 관리 페이지 수정

## 📝 남은 작업

### Phase 2.4.3: 상세 페이지 구현 (우선순위: 높음)

#### Rentals 상세 페이지 (`/rentals/[uuid]/page.tsx`)

- Equipment 상세 페이지 패턴 적용
- 승인/반려 버튼 (권한에 따라)
- 취소 버튼 (승인 전만)
- 반납 처리 버튼

#### Checkouts 상세 페이지 (`/checkouts/[uuid]/page.tsx`)

- Equipment 상세 페이지 패턴 적용
- 반출된 장비 목록 표시
- 1차/최종 승인 버튼 (권한에 따라)
- 반려 버튼 (사유 필수)
- 반입 처리 버튼

## ✅ 다음 단계

1. **즉시 시작**: 상세 페이지 구현부터 진행
2. **패턴 준수**: Equipment 상세 페이지와 동일한 구조 및 스타일
3. **테스트**: 각 페이지에서 실제 API 호출 테스트

자세한 구현 가이드라인은 각 섹션의 체크리스트를 참조하세요.
