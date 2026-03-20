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

## 프로젝트 컨텍스트

- **개발 환경**: 1인 개발자 (개발 + 테스트 동일인)
- **DB 구조**: **단일 DB** — `postgres_equipment` (포트 5432). 테스트 DB 분리 제안 금지.
- **기술 스택**: NestJS, Drizzle ORM, PostgreSQL, Next.js 16 (App Router), React 19, TailwindCSS, NextAuth.js, pnpm workspace
- **인증**: NextAuth를 단일 인증 소스로 사용. localStorage 토큰 사용 금지.

---

## 역할 체계 (UL-QP-18 Section 4)

| 역할 코드 | 절차서 역할 | 주요 권한 |
|---|---|---|
| `test_engineer` | 시험실무자 | 장비 운영/관리, 점검 실시, 이력카드 작성, 반출입 확인서 작성 |
| `technical_manager` | 기술책임자 | 교정계획 수립, 점검 결과 확인, 반출입 승인, 보정인자 관리 |
| `quality_manager` | 품질책임자 | 교정계획 검토 (대부분 읽기 전용) |
| `lab_manager` | 시험소장 | 교정계획 승인, 장비 폐기 승인, 시험소 전체 관리 (모든 권한) |

**상세 역할/권한**: [references/roles.md](references/roles.md)

---

## 관리번호 체계 (UL-QP-18 Section 7.5)

```
XXX – X YYYY
 │    │  └── 일련번호 (4자리, 0001~9999)
 │    └───── 분류코드 (E/R/W/S/A/P)
 └────────── 시험소코드 (SUW/UIW/PYT)
```

**시험소코드**: SUW(수원), UIW(의왕), PYT(평택)

| 코드 | 분류 (= 팀 이름) | 사이트 |
|---|---|---|
| E | FCC EMC/RF | 수원 |
| R | General EMC | 수원 |
| W | General RF | 의왕 |
| S | SAR | 수원 |
| A | Automotive EMC | 수원, 평택 |
| P | Software Program | - |

**상세 관리번호 및 위치코드**: [references/management-numbers.md](references/management-numbers.md)

---

## 핵심 용어 (UL-QP-18 기준)

| 용어 | 정의 |
|---|---|
| **장비(Equipment)** | 시험소에서 시험에 사용하는 설비와 장비 통칭 |
| **교정(Calibration)** | 외부/내부 교정기관을 통한 장비 정밀도 검증 |
| **중간점검** | 교정 신뢰성 확인을 위한 교정 주기 사이 점검 |
| **자체점검** | 비교정 대상 장비에 대한 주기적 점검 |
| **소급성(Traceability)** | 국가/국제 표준과 연결되는 측정 결과 특성 |
| **공용장비** | 안전인증 시험팀에서 관리, EMC-W 분야 시험에 사용 가능한 장비 |

**상세 용어**: [references/terminology.md](references/terminology.md)

---

## 주요 기능별 프로세스

### 장비 등록/수정 (2단계 승인)

```
시험실무자 요청 → pending_approval → 기술책임자 승인 → approved
                                   ↘ 반려 → rejected
```

**예외**: 시험소 관리자(lab_manager)는 자체 승인 가능

### 교정 기록 등록 (엄격한 직무분리)

```
시험실무자 등록: pending_approval → 기술책임자/시험소장 승인
```

- ✓ 시험실무자만 등록 가능 (기술책임자, 시험소장은 등록 불가)
- ✓ 등록자와 승인자 완전 분리 (UL-QP-18 견제 구조)

### 점검 프로세스 (UL-QP-18 Section 8)

- **중간점검**: 교정검사 신뢰성 확인용 (UL-QP-18-03)
- **자체점검**: 비교정 대상 장비 (UL-QP-18-05)

**상세 점검/교정**: [references/inspection-calibration.md](references/inspection-calibration.md)

### 반출/반입 프로세스 (1단계 승인)

**모든 목적 (교정/수리/시험소간 대여)**:

```
pending → [기술책임자 승인] → approved → checked_out → returned → return_approved
```

**상세 승인 프로세스**: [references/approval-processes.md](references/approval-processes.md)

### 부적합 장비 관리 (UL-QP-18 Section 9)

```
[이상 발견] → open (장비: non_conforming)
    → analyzing (원인 분석)
    → corrected (조치 완료)
    → [기술책임자 승인] → closed (장비: available)
```

필수 조치: 사용중지 식별표 부착, 기술책임자 즉시 보고, 영향도 평가, 이력카드 기록.

---

## 데이터베이스 스키마 핵심

### 장비 상태 Enum (SSOT: `packages/schemas/src/enums.ts`)

| 상태 | 의미 | 표시 규칙 |
|---|---|---|
| `available` | 사용 가능 | 기본 배지 |
| `in_use` | 사용 중 | 기본 배지 |
| `checked_out` | 반출 중 | purpose 필드로 구분 |
| `calibration_scheduled` | 교정 예정 | **"사용 가능"** + D-day 배지 |
| `calibration_overdue` | 교정 기한 초과 | **"부적합"** 빨간 배지 |
| `non_conforming` | 부적합 | 빨간 배지 |
| `spare` | 여분 | 기본 배지 |
| `retired` | 폐기 | 기본 배지 |
| `pending_disposal` | 폐기 대기 | 기본 배지 |
| `disposed` | 폐기 완료 | 기본 배지 |
| `temporary` | 임시 | 기본 배지 |
| `inactive` | 비활성 | 기본 배지 |

### 팀별/사이트별 권한 제한

- EMC팀은 RF팀 장비 반출 신청/승인 불가
- 장비 등록 시 관리 팀(teamId) 및 시험소(site) 필수
- 조회는 전체 가능, 수정/승인은 권한 범위 내에서만

---

## 보정계수 관리 (UL-QP-18 Section 10.4-10.6)

- 교정기관 제시 방법 우선
- 별도 방법 미제시 시: **선형 보간법** 또는 **큰 쪽 보정값** 활용
- 기술책임자가 최신화 관리

---

## 소프트웨어 관리 (UL-QP-18 Section 14)

- 데이터 수집/처리/제어용 소프트웨어 도입 전 유효성 확인 필수
- 소프트웨어 관리대장 (UL-QP-18-07) 유지

---

## 기록 보존 연한 (UL-QP-18 Section 15)

| 양식 | 양식번호 | 보존연한 |
|---|---|---|
| 시험설비 관리대장 | UL-QP-18-01 | **영구** |
| 시험설비 이력카드 | UL-QP-18-02 | **영구** |
| 중간 점검표 | UL-QP-18-03 | 5년 |
| 자체 점검표 | UL-QP-18-05 | 5년 |
| 장비 반·출입 확인서 | UL-QP-18-06 | 5년 |
| 소프트웨어 관리대장 | UL-QP-18-07 | 5년 |
| 보정인자 관리대장 | UL-QP-18-11 | 5년 |

---

## 장비 필터 관리 (SSOT)

장비 목록 필터는 **공유 유틸리티** (`equipment-filter-utils.ts`)를 사용하여 클라이언트와 서버 간 일관성을 유지합니다.

- 항상 `equipment-filter-utils.ts`의 공유 함수 사용
- 새 필터 추가 시 `equipment-filter-utils.ts` 먼저 수정
- page.tsx에서 직접 searchParams 파싱 금지

---

## Azure AD 그룹 매핑

| Azure AD 그룹 | 팀 이름 (분류) |
|---|---|
| `LST.SUW.RF` | FCC EMC/RF (E) |
| `LST.SUW.EMC` | General EMC (R) |
| `LST.SUW.SAR` | SAR (S) |
| `LST.SUW.Automotive` | Automotive EMC (A) |
| `LST.UIW.RF` | General RF (W) |
| `LST.PYT.Automotive` | Automotive EMC (A) |

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

## 추가 참조 (필요 시 읽기)

### 도메인 지식

- **용어 정의**: [references/terminology.md](references/terminology.md)
- **역할 체계 상세**: [references/roles.md](references/roles.md)
- **관리번호/위치코드**: [references/management-numbers.md](references/management-numbers.md)
- **시험설비 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)
- **점검/교정 프로세스**: [references/inspection-calibration.md](references/inspection-calibration.md)
- **승인 프로세스 상세**: [references/approval-processes.md](references/approval-processes.md)

### 아키텍처 & 코딩

- **10가지 아키텍처 패턴 (CAS, Token Refresh, Cache 등)**: [references/architecture-patterns.md](references/architecture-patterns.md)
- **코딩 규칙 + 반복 실수 패턴**: [references/coding-rules.md](references/coding-rules.md)
- **프론트엔드 UI 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)
- **인증 아키텍처**: [references/auth-architecture.md](references/auth-architecture.md)
- **E2E 테스트 인증**: [references/e2e-test-auth.md](references/e2e-test-auth.md)
- **필터 유틸리티 템플릿**: [references/filter-utils-template.md](references/filter-utils-template.md)

### 연관 스킬

- **Next.js 16 개발 가이드**: `/nextjs-16`

### 프로젝트 문서

- **장비 관리 절차서**: `/docs/development/장비관리절차서.md`
- **API 표준**: `/docs/development/API_STANDARDS.md`
- **인증 아키텍처 상세**: `/docs/development/AUTH_ARCHITECTURE.md`
- **개발 환경 설정**: `/docs/development/DEV_SETUP.md`
