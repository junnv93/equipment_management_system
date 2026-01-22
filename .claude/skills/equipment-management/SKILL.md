---
name: equipment-management
description: |
  장비 관리 시스템(Equipment Management System) 개발 가이드. UL-QP-18 장비 관리 절차서 기반의 시험소 장비 관리 시스템 구현을 위한 전문 스킬입니다.

  사용 시점:
  (1) 장비 등록/수정/삭제 API 또는 UI 개발 시
  (2) 시험설비이력카드(UL-QP-18-02) 관련 기능 구현 시
  (3) 교정(Calibration) 기록 관리 및 승인 프로세스 구현 시
  (4) 점검(중간점검/자체점검) 기능 구현 시
  (5) 대여(Rental) 또는 반출(Checkout) 기능 구현 시
  (6) 보정계수(Calibration Factor) 관리 기능 구현 시
  (7) 부적합 장비(Non-Conformance) 관리 기능 구현 시
  (8) 소프트웨어 관리대장(UL-QP-18-07) 기능 구현 시
  (9) 교정계획서 작성 및 승인 기능 구현 시
  (10) 사용자 역할 및 권한 체계 관련 개발 시
  (11) 프론트엔드 UI 개발 시 (Next.js 16 App Router 패턴)
  (12) 관리번호 체계 및 위치 코드 관련 개발 시
  (13) 인증/인가 관련 개발 시 (NextAuth 토큰 관리)
---

# 장비 관리 시스템 개발 가이드

**기준 문서**: UL-QP-18 장비 관리 절차서 (개정번호 15, 2026.01.14)

---

## ⚠️ 필독: 프로젝트 컨텍스트

**이 스킬을 사용하기 전에 반드시 읽으세요!**

### 프로젝트 특성
- **개발 환경**: 1인 개발자 (개발 + 테스트 동일인)
- **DB 구조**: **단일 DB 통합** (개발 DB = 테스트 DB)
- **데이터 중요도**: 개발 데이터 중요하지 않음

### 🔴 절대 금지
```
❌ "테스트 DB와 개발 DB를 분리해야..."
❌ "두 DB를 동기화하려면..."
❌ postgres_equipment_test (제거됨)
❌ localhost:5434 (사용 안함)
❌ equipment_management_test (사용 안함)
```

### ✅ 올바른 접근
```
✅ 단일 DB 사용: postgres_equipment (포트 5433)
✅ DB 명령어: pnpm db:push
✅ 테스트: 개발 DB에서 실행
✅ 환경: 개발 + 테스트 통합
```

**자세한 내용**: `/.claude/PROJECT_RULES.md` 참조

---

## 기술 스택

- **Backend**: NestJS, Drizzle ORM, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **인증**: NextAuth.js (Azure AD + Credentials), JWT
- **Monorepo**: pnpm workspace
- **개발 환경**: Docker (PostgreSQL, Redis만) + 로컬 실행 (앱)

> **인증 아키텍처**: NextAuth를 단일 인증 소스로 사용. localStorage 토큰 사용 금지.
> 상세: [references/auth-architecture.md](references/auth-architecture.md)

---

## 개발 환경 설정

### 빠른 시작 (Phase 1: 로컬 개발)

```bash
# 1. 자동 설정 (처음 한 번만)
./scripts/setup-dev.sh

# 2. 개발 서버 시작
pnpm dev
# 또는
make dev
```

**접속 주소:**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- PostgreSQL: localhost:5433
- Redis: localhost:6380

### 개발 환경 원칙

**Phase 1 (현재 - 1인 개발):**
- ✅ **Docker**: PostgreSQL, Redis만
- ✅ **로컬 실행**: 백엔드, 프론트엔드
- ✅ 빠른 개발, hot-reload 지원

```bash
# Docker 인프라만 시작
make docker-up    # 또는 docker-compose up -d postgres redis

# 앱은 로컬에서
pnpm dev
```

**Phase 2 (팀 확장 준비):**
- 하이브리드 접근 또는 계속 로컬
- 온보딩 자동화 강화

**Phase 3 (3인+ 팀):**
- 완전 컨테이너화 (선택)
- CI/CD 파이프라인

**상세 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md`

### 주요 명령어

```bash
# 개발
make dev                # 전체 개발 서버 시작
make docker-up          # PostgreSQL & Redis만
make docker-down        # Docker 컨테이너 중지

pnpm dev                # 백엔드 + 프론트엔드
pnpm --filter backend run dev      # 백엔드만
pnpm --filter frontend run dev     # 프론트엔드만

# DB
pnpm --filter backend run db:push      # 스키마 변경 적용
pnpm --filter backend run db:studio    # Drizzle Studio

# 빌드 & 테스트
pnpm build              # 전체 빌드
pnpm test               # 테스트
```

### 트러블슈팅

**dist 폴더 권한 문제:**
```bash
sudo rm -rf apps/backend/dist
pnpm --filter backend run start:dev
```

**포트 충돌:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**상세 가이드**: `/docs/development/DEV_SETUP.md`

---

## 핵심 용어 (UL-QP-18 기준)

| 용어 | 정의 |
|------|------|
| **장비(Equipment)** | 시험소에서 시험에 사용하는 설비와 장비 통칭 |
| **점검(Inspection)** | 장비/측정시스템에 대한 측정 오차를 줄이기 위한 업무 |
| **교정(Calibration)** | 외부/내부 교정기관을 통한 장비 정밀도 검증 |
| **중간점검** | 교정 신뢰성 확인을 위한 교정 주기 사이 점검 |
| **자체점검** | 비교정 대상 장비에 대한 주기적 점검 |
| **소급성(Traceability)** | 국가/국제 표준과 연결되는 측정 결과 특성 |
| **공용장비** | 안전인증 시험팀에서 관리, EMC-W 분야 시험에 사용 가능한 장비 |
| **미관리 장비** | 상시 관리하지 않는 장비(여분 장비 등) |

**상세 용어**: [references/terminology.md](references/terminology.md)

---

## 역할 체계 (UL-QP-18 Section 4)

| 역할 코드 | 절차서 역할 | 영문 | 주요 권한 |
|-----------|-------------|------|-----------|
| `test_engineer` | 시험실무자 | Test Engineer | 장비 운영/관리, 점검 실시, 이력카드 작성, 반출입 확인서 작성 |
| `technical_manager` | 기술책임자 | Technical Manager | 교정계획 수립, 점검 결과 확인, 반출입 승인, 보정인자 관리 |
| `lab_manager` | 시험소장 | Lab Manager | 교정계획 승인, 장비 폐기 승인, 시험소 전체 관리 |
| `system_admin` | 시스템 관리자 | System Admin | 전체 시스템 관리, 모든 시험소 접근 |

**상세 역할/권한**: [references/roles.md](references/roles.md)

---

## 관리번호 체계 (UL-QP-18 Section 7.5)

```
XXX – X YYYY
 │    │  └── 일련번호
 │    └───── 분류코드 (E/R/W/S/A/P)
 └────────── 시험소코드 (SUW/UIW/PYT)
```

**시험소코드**: SUW(수원), UIW(의왕), PYT(평택)

**분류코드**:
| 코드 | 분류 |
|------|------|
| E | FCC EMC/RF |
| R | General EMC |
| W | General RF |
| S | SAR |
| A | Automotive EMC |
| P | Software Program |

**상세 관리번호 및 위치코드**: [references/management-numbers.md](references/management-numbers.md)

---

## 시험설비 이력카드 (UL-QP-18 Section 7.6-7.7)

시험실무자가 작성/갱신해야 하는 필수 항목:

| 항목 | 설명 |
|------|------|
| 장비명(모델명) | Equipment name (model name) |
| 유형/고유 식별표시 | Type identification |
| 제조업체/공급업체명 | Manufacturer, supplier |
| 시방일치 여부 | Specification agreement |
| 부속품/주요 기능 | Accessories and main functions |
| 교정 필요 여부/주기 | Calibration necessity and period |
| 관련 소프트웨어/매뉴얼 | Related software and manuals |
| 운영책임자(정, 부) | Operating Officer |
| 설치 위치/일자 | Installation location, date |
| 이력(위치변동/교정/수리 등) | History records |

**상세 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)

---

## 핵심 규칙

### 1. 승인 프로세스 공통 규칙

```typescript
// 반려 시 사유 필수 (최소 10자)
if (action === 'reject' && (!reason || reason.length < 10)) {
  throw new BadRequestException('반려 사유는 10자 이상 필수입니다');
}

// 다중 승인자 선착순 처리 (Optimistic Locking)
const updated = await db
  .update(requests)
  .set({ status: 'approved', approvedBy: userId, version: currentVersion + 1 })
  .where(and(eq(requests.uuid, uuid), eq(requests.version, currentVersion)));

if (updated.rowCount === 0) {
  throw new ConflictException('이미 처리된 요청입니다');
}
```

### 2. 팀별/사이트별 권한 제한

- EMC팀은 RF팀 장비 반출 신청/승인 불가
- 장비 등록 시 관리 팀(teamId) 및 시험소(site) 필수
- 조회는 전체 가능, 수정/승인은 권한 범위 내에서만

### 3. 기술책임자 직접 등록 규칙 (교정 기록)

```typescript
// 기술책임자/시험소관리자 직접 등록 시 registrarComment 필수
if (isTechnicalOrHigher && (!dto.registrarComment || dto.registrarComment.length < 5)) {
  throw new BadRequestException('기술책임자 등록 시 코멘트는 필수입니다');
}
```

---

## 주요 기능별 프로세스

### 장비 등록/수정 (2단계 승인)

```
시험실무자 요청 → pending_approval → 기술책임자 승인 → approved
                                   ↘ 반려 → rejected
```

**예외**: 시험소 관리자(lab_manager)는 자체 승인 가능

### 교정 기록 등록

```
기술책임자 직접 등록: approved (registrarComment 필수)
시험실무자 등록: pending_approval → 기술책임자 승인 (approverComment 필수)
```

### 점검 프로세스 (UL-QP-18 Section 8)

- **중간점검**: 교정검사 신뢰성 확인용, 중간점검표(UL-QP-18-03) 기록
- **자체점검**: 비교정 대상 장비, 자체점검표(UL-QP-18-05) 기록

**상세 점검/교정**: [references/inspection-calibration.md](references/inspection-calibration.md)

### 반출/반입 프로세스 (모든 목적 1단계 승인 통합)

**모든 목적 (교정/수리/시험소간 대여)**:
```
pending → [기술책임자 승인] → approved → checked_out → returned → return_approved
```

**시험소간 대여 추가 사항**: 반입 시 양측 확인 필요

**상세 승인 프로세스**: [references/approval-processes.md](references/approval-processes.md)

---

## 부적합 장비 관리 (UL-QP-18 Section 9)

### 상태 흐름

```
[이상 발견] → open (장비: non_conforming, 사용중지 식별표)
    ↓
analyzing (원인 분석)
    ↓
corrected (조치 완료)
    ↓
[기술책임자 승인] → closed (장비: available)
```

### 필수 조치 사항

1. **사용중지 식별표** 부착 또는 격리 보관
2. 기술책임자에게 **즉시 보고**
3. 부적합 발생일 추적하여 **영향도 평가**
4. 필요시 **재시험 실시**
5. 시험설비 이력카드에 **기록**

---

## 소프트웨어 관리 (UL-QP-18 Section 14)

### 유효성 확인 (UL-QP-18-09)

- 데이터 수집/처리/제어용 소프트웨어 도입 전 유효성 확인 필수
- 공급자 검증 기록으로 대체 가능
- 자체 개발 소프트웨어: 기술책임자가 유효성 확인 실시

### 소프트웨어 관리대장 (UL-QP-18-07)

```typescript
{
  softwareName: string;
  version: string;
  purpose: string;            // 용도 (데이터 수집/처리/제어/기록)
  equipmentId?: string;       // 관련 장비
  validatedBy: string;        // 유효성 확인자
  validatedAt: Date;
  validationRecord: string;   // 검증 기록
}
```

---

## 보정계수 관리 (UL-QP-18 Section 10.4-10.6)

### 적용 규칙 (보정인자 및 파라미터 관리대장 UL-QP-18-11)

- 교정기관 제시 방법 우선
- 별도 방법 미제시 시: **선형 보간법** 또는 **큰 쪽 보정값** 활용
- 기술책임자가 최신화 관리

### 보정 방법 코드

```typescript
enum CorrectionMethodEnum {
  LINEAR_INTERPOLATION = 'linear_interpolation',  // 선형 보간법
  HIGHER_VALUE = 'higher_value',                  // 큰 쪽 보정값
  CALIBRATION_AGENCY = 'calibration_agency',      // 교정기관 제시
}
```

---

## 기록 보존 연한 (UL-QP-18 Section 15)

| 양식 | 양식번호 | 보존연한 |
|------|----------|----------|
| 시험설비 관리대장 | UL-QP-18-01 | **영구** |
| 시험설비 이력카드 | UL-QP-18-02 | **영구** |
| 중간 점검표 | UL-QP-18-03 | 5년 |
| 자체 점검표 | UL-QP-18-05 | 5년 |
| 장비 반·출입 확인서 | UL-QP-18-06 | 5년 |
| 소프트웨어 관리대장 | UL-QP-18-07 | 5년 |
| 보정인자 관리대장 | UL-QP-18-11 | 5년 |

---

## 데이터베이스 스키마

### 장비 (equipment)

```typescript
{
  uuid: string;
  name: string;
  managementNumber: string;           // 관리번호 (XXX-XYYYY)
  site: 'suwon' | 'uiwang' | 'pyeongtaek';
  siteCode: 'SUW' | 'UIW' | 'PYT';
  classificationCode: 'E' | 'R' | 'W' | 'S' | 'A' | 'P';
  teamId: string;
  status: EquipmentStatusEnum;
  approvalStatus: ApprovalStatusEnum;

  // 교정 관련
  calibrationMethod: 'external_calibration' | 'self_inspection' | 'not_applicable';
  calibrationRequired: boolean;       // 교정 필요 여부
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationCycle?: number;          // 교정 주기 (월)

  // 점검 관련
  lastIntermediateCheckDate?: Date;   // 마지막 중간점검일
  lastSelfCheckDate?: Date;           // 마지막 자체점검일
  checkCycle?: number;                // 점검 주기 (월)

  // 공용장비 관련
  isShared: boolean;
  sharedSource?: 'safety_lab' | 'external';

  // 미관리 장비 플래그
  isUnmanaged: boolean;               // 미관리 장비 여부
  unmanagedReason?: string;           // 미관리 사유

  // 운영책임자
  primaryOperatorId: string;          // 운영책임자(정)
  secondaryOperatorId?: string;       // 운영책임자(부)

  // 첨부파일
  attachmentPath?: string;            // 검수보고서/이력카드 파일
  manualLocation?: string;            // 매뉴얼 보관 위치
}
```

### 장비 상태 Enum

```typescript
enum EquipmentStatusEnum {
  AVAILABLE = 'available',              // 사용가능
  IN_USE = 'in_use',                    // 사용중
  CHECKED_OUT = 'checked_out',          // 반출중 (교정/수리 목적은 반출 레코드에서 관리)
  CALIBRATION_SCHEDULED = 'calibration_scheduled',  // 교정예정
  CALIBRATION_OVERDUE = 'calibration_overdue',      // 교정기한초과
  NON_CONFORMING = 'non_conforming',    // 부적합 (임시, 수리 후 복귀 가능)
  SPARE = 'spare',                      // 여분 (보유하고 있지만 상시 관리하지 않음)
  RETIRED = 'retired',                  // 폐기 (영구)
}

/**
 * 상태 표시 규칙:
 * - checked_out: 반출 레코드(checkouts 테이블)의 purpose 필드로 구분
 *   - internal_calibration → UI에서 "교정중"으로 표시 (향후 개선)
 *   - internal_repair → UI에서 "수리중"으로 표시 (향후 개선)
 *   - external_rental → UI에서 "대여중"으로 표시 (향후 개선)
 * - spare: 여분 장비로 따로 관리하지 않는 상태
 */
```

---

## 프론트엔드 개발 패턴

> **중요**: Next.js 16 상세 패턴은 `/nextjs-16` 스킬 참조

### 필수 규칙

1. **params는 Promise** - 반드시 await 사용
2. **useActionState** 사용 (useFormState 아님)
3. **Form action은 void 반환**
4. **any 타입 금지**

```typescript
// 올바른 패턴
export default async function Page(props: PageProps<'/equipment/[id]'>) {
  const { id } = await props.params;
  const equipment = await getEquipment(id);
  return <EquipmentDetail equipment={equipment} />;
}
```

**상세 UI 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)

---

## E2E 테스트

> **중요**: Playwright E2E 테스트에서 NextAuth 인증을 올바르게 처리하는 방법

### 핵심 원칙

**절대 금지**:
- ❌ 백엔드 JWT를 직접 쿠키에 저장
- ❌ NextAuth를 우회하는 어떤 방법
- ❌ `localStorage`에 토큰 저장

**권장 사항**:
- ✅ NextAuth Provider를 통한 인증 (test-login)
- ✅ NextAuth callback API 직접 호출
- ✅ "단일 인증 소스(SSOT)" 원칙 준수

### 올바른 인증 플로우

```typescript
// ✅ 올바른 E2E 테스트 로그인 방식
async function loginAs(page: Page, role: string) {
  // 1. CSRF 토큰 획득
  const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
  const { csrfToken } = await csrfResponse.json();

  // 2. NextAuth callback API로 POST 요청
  const loginResponse = await page.request.post(
    'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
    {
      form: {
        role: role,
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  // 3. 메인 페이지로 이동하여 세션 확인
  await page.goto('/');
}
```

**상세 가이드**: [references/e2e-test-auth.md](references/e2e-test-auth.md)

---

## API 엔드포인트 패턴

### CRUD 기본

```
GET    /[resource]           목록 조회 (필터 지원)
GET    /[resource]/:uuid     상세 조회
POST   /[resource]           생성 (pending_approval 상태)
PATCH  /[resource]/:uuid     수정 (draft 상태만)
DELETE /[resource]/:uuid     삭제 (draft 상태만)
```

### 승인 관련

```
PATCH  /[resource]/:uuid/approve   승인
PATCH  /[resource]/:uuid/reject    반려 (reason 필수)
DELETE /[resource]/:uuid/cancel    취소 (pending 상태만)
```

---

## 검증 명령어

```bash
pnpm tsc --noEmit   # 타입 체크
pnpm test           # 테스트
pnpm db:generate    # 마이그레이션 생성
pnpm db:migrate     # 마이그레이션 실행
pnpm dev            # 개발 서버
```

---

## 참조 문서

### 스킬 내 참조
- **용어 정의**: [references/terminology.md](references/terminology.md)
- **역할 체계 상세**: [references/roles.md](references/roles.md)
- **관리번호/위치코드**: [references/management-numbers.md](references/management-numbers.md)
- **시험설비 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)
- **점검/교정 프로세스**: [references/inspection-calibration.md](references/inspection-calibration.md)
- **승인 프로세스 상세**: [references/approval-processes.md](references/approval-processes.md)
- **프론트엔드 UI 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)
- **인증 아키텍처**: [references/auth-architecture.md](references/auth-architecture.md) - NextAuth 토큰 관리, localStorage 금지 정책
- **E2E 테스트 인증**: [references/e2e-test-auth.md](references/e2e-test-auth.md) - Playwright E2E 테스트에서 NextAuth 인증 처리, 잘못된 접근 vs 올바른 접근

### 연관 스킬
- **Next.js 16 개발 가이드**: `/nextjs-16` - 프론트엔드 UI 개발 시 함께 사용

### 프로젝트 문서
- **장비 관리 절차서**: `/docs/development/장비관리절차서.md` (UL-QP-18)
- **API 표준**: `/docs/development/API_STANDARDS.md`
- **인증 아키텍처 상세**: `/docs/development/AUTH_ARCHITECTURE.md`
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` - Playwright E2E 테스트 인증 완벽 가이드
- **개발 환경 설정**: `/docs/development/DEV_SETUP.md` - 개발 환경 구축 가이드, 트러블슈팅
- **팀 확장 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md` - Phase 1→2→3 단계별 전환 가이드
