---
name: verify-ssot
description: SSOT(Single Source of Truth) 임포트 소스를 검증합니다. 타입/enum/상수가 올바른 패키지에서 임포트되는지 확인. 타입/enum 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 패키지명]'
---

# SSOT 임포트 소스 검증

## Purpose

타입, enum, 상수가 올바른 패키지에서 임포트되는지 검증합니다:

1. **Enum/타입 임포트** — `UserRole`, `EquipmentStatus` 등은 `@equipment-management/schemas`에서 임포트
2. **Permission 임포트** — `@equipment-management/shared-constants`에서 임포트
3. **API 엔드포인트 임포트** — `@equipment-management/shared-constants`에서 임포트
4. **로컬 재정의 금지** — 패키지에 정의된 타입을 로컬에서 재정의하지 않음
5. **Icon Library 통합** — lucide-react 표준 준수

> **하드코딩 값 탐지는 `/verify-hardcoding`에서 수행합니다.**

## When to Run

- 새로운 enum이나 타입을 추가한 후
- import 경로를 변경한 후
- 새로운 모듈/컴포넌트를 추가한 후

## Related Files

핵심 SSOT 패키지 요약 (전체 파일 목록: [references/ssot-file-map.md](references/ssot-file-map.md)):

| Package / Layer | SSOT 항목 |
|---|---|
| `packages/schemas/` | Enum, 타입, ErrorCode, 설정 기본값, VM 검증 메시지, DocumentType |
| `packages/shared-constants/` | Permission, API 경로, 스코프 정책, 비즈니스 규칙, 엔티티 라우트, Test Users |
| `packages/db/` | DB enum 배열, AppDatabase 타입 |

## Workflow

### Step 1: 로컬 enum/타입 재정의 탐지

패키지에 정의된 핵심 타입(UserRole, EquipmentStatus, SystemSettings 등)이 로컬에서 재정의되는지 확인.
**PASS:** 0개 결과. **FAIL:** 로컬 타입 정의 발견 시 패키지 임포트로 변경.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 1

### Step 2: Permission 임포트 소스 확인

**PASS:** 모든 Permission이 `@equipment-management/shared-constants`에서 import. **FAIL:** 다른 소스 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 2

### Step 3: 패키지별 임포트 소스 확인 (3a~3e 포함)

API_ENDPOINTS, Audit Log 타입, Field Labels, Entity Routes, Data Scope, SSOT 상수의 import 소스 확인.
**PASS:** 모두 올바른 패키지에서 import. **FAIL:** 잘못된 소스 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 3

### Step 4: Icon Library 통합 확인

react-icons(deprecated) 사용 및 비표준 icon library 탐지.
**PASS:** lucide-react만 사용. **FAIL:** react-icons 또는 비표준 라이브러리 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 4

### Step 5~13: 추가 SSOT 검증

| Step | 검증 대상 |
|---|---|
| 5 | AppDatabase SSOT 타입 (NodePgDatabase 직접 import 금지) |
| 6 | ApiResponse 로컬 재정의 |
| 7 | APPROVAL_KPI 임포트 소스 |
| 8 | 신규 shared-constants SSOT (APPROVAL_CATEGORIES, BUSINESS_RULES 등) |
| 9 | DB Enum 배열 SSOT 참조 |
| 10 | REJECTION_STAGE_VALUES SSOT |
| 11 | VM (Validation Messages) 임포트 소스 |
| 12 | Test User Constants SSOT |
| 13 | DocumentTypeValues SSOT |

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 5~13

## Output Format

```markdown
| #   | 검사                          | 상태      | 상세                                   |
| --- | ----------------------------- | --------- | -------------------------------------- |
| 1   | 로컬 타입 재정의              | PASS/FAIL | 재정의 위치 목록                       |
| 2   | Permission 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3   | API_ENDPOINTS 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3a  | Audit Log 타입 임포트         | PASS/FAIL | 잘못된 임포트 위치                     |
| 3b  | Field Labels 임포트           | PASS/FAIL | 잘못된 임포트 위치                     |
| 3c  | Entity Routes 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3d  | Data Scope 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3e  | Audit Log SSOT 상수           | PASS/FAIL | 잘못된 임포트 위치                     |
| 4   | Icon Library 통합             | PASS/FAIL | 비표준 library 위치                    |
| 5   | AppDatabase SSOT 타입         | PASS/FAIL | NodePgDatabase 직접 import 위치        |
| 6   | ApiResponse 로컬 재정의       | PASS/FAIL | 재정의 위치                            |
| 7   | APPROVAL_KPI 임계값           | PASS/FAIL | 잘못된 import 위치                     |
| 8   | 신규 shared-constants SSOT    | PASS/FAIL | 로컬 재정의 위치                       |
| 9   | DB Enum 배열 SSOT 참조        | PASS/FAIL | 하드코딩 enum 배열 위치                |
| 10  | REJECTION_STAGE_VALUES SSOT   | PASS/FAIL | 로컬 선언 위치                         |
| 11  | VM 임포트 소스                | PASS/FAIL | 잘못된 VM import 위치                  |
| 12  | Test User Constants SSOT      | PASS/FAIL | 로컬 재정의 위치                       |
| 13  | DocumentTypeValues SSOT       | PASS/FAIL | 문자열 하드코딩 위치                   |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS`, `CLASSIFICATION_OPTIONS` 등 레이블+값 쌍 UI 표시용 객체는 로컬 정의 허용
2. **packages/ 디렉토리 내 정의** — 패키지 자체에서의 타입 정의는 SSOT 원본
3. **테스트 파일의 mock 타입** — 테스트에서 사용하는 mock 타입 정의는 허용
4. **re-export 파일** — `export type { UserRole } from '@equipment-management/schemas'` 같은 재내보내기는 정상
5. **NestJS Swagger DTO** — 백엔드 응답 DTO에서 Swagger 문서화용 class 정의는 허용
6. **백엔드 DTO의 re-export** — SSOT 소비자이므로 정상
7. **roles.enum.ts의 TypeScript enum** — 백엔드 호환성을 위한 로컬 enum (SSOT 주석 + re-export 동반 시 면제)
8. **`Promise<unknown>` 허용 케이스** — `private` 헬퍼 메서드나 단순 delete/count 반환은 면제
