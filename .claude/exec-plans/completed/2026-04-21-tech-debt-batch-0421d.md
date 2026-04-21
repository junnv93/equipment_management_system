# Exec Plan: tech-debt-batch-0421d

**날짜**: 2026-04-21  
**슬러그**: tech-debt-batch-0421d  
**모드**: Mode 2 (multi-domain)  
**소스**: tech-debt-tracker.md open 항목 5건

---

## Scope

| # | 항목 | 파일 | 변경 유형 |
|---|------|------|-----------|
| 1 | LoginProviders `error` 미소비 | `apps/frontend/components/auth/LoginPageContent.tsx` | 수정 |
| 2 | `managementNumber: ''` 이벤트 페이로드 | `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` | 수정 (3곳) |
| 3 | Self-inspection renderer barrel import | `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts` | 수정 |
| 4 | Intermediate-inspection renderer barrel import | `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts` | 수정 |
| 5 | SecurityService 단위 스펙 | `apps/backend/src/modules/security/__tests__/security.service.spec.ts` | 신규 |
| 6 | checkout-form-renderer 스펙 | `apps/backend/src/modules/checkouts/__tests__/checkout-form-renderer.service.spec.ts` | 신규 |
| 7 | equipment-import-form-renderer 스펙 | `apps/backend/src/modules/equipment-imports/__tests__/equipment-import-form-renderer.service.spec.ts` | 신규 |

**범위 외**: 위 7개 파일 이외 수정 금지.

---

## Phase 1: Frontend — LoginProviders error 분기

**파일**: `apps/frontend/components/auth/LoginPageContent.tsx`

**목표**: `useAuthProviders()`의 `error` 필드를 소비하여 백엔드 다운 상황을 "인증 제공자 미설정"과 구분.

**성공 기준**:
- `LoginProviders()` 함수 내 `useAuthProviders()` 구조 분해에 `error` 포함
- `error`가 있고 `isLoading === false`이고 `!hasAzureAD && !hasCredentials`인 경우: 백엔드 접속 불가 메시지 표시
- `error` 없고 `!hasAzureAD && !hasCredentials`인 경우: 기존 "인증 제공자 설정 필요" 메시지 유지
- 기존 `isLoading` 스켈레톤·`hasAzureAD`·`hasCredentials` 분기 로직 변경 없음
- `AUTH_CONTENT` 또는 번역 키 활용 (하드코딩 금지)

---

## Phase 2: Backend — managementNumber 빈 문자열 제거

**파일**: `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts`

**목표**: `ImportNotificationEvent`의 `managementNumber?: string` 옵셔널 필드에 `''` 하드코딩 대신 키 자체를 생략.

**성공 기준**:
- L159, L354, L408의 `managementNumber: ''` → 해당 키-값 쌍 제거 (필드 생략 = undefined)
- 타입 체크 통과 (`managementNumber?: string`)
- 이벤트 리스너의 `managementNumber` 소비 로직 영향 없음

---

## Phase 3: Backend — Inspector Renderer Canonical Import

**파일 2개**:
- `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts`
- `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts`

**목표**: `../../reports/docx-template.util` barrel import → canonical 경로 직접 import.

**성공 기준**:
- `DocxTemplate` import 경로: `../../reports/docx-template.util` → `../../../common/docx/docx-template.util`
- `insertDocxSignature`, `renderResultSections` 경로는 변경하지 않음 (이미 canonical이거나 다른 파일)
- tsc 컴파일 통과

---

## Phase 4: SecurityService 단위 스펙

**파일**: `apps/backend/src/modules/security/__tests__/security.service.spec.ts` (신규)

**목표**: `saveReport()` 정상 경로와 오류 무전파(throw 금지) 동작 검증.

**성공 기준**:
- DB INSERT 정상 경로: mock db.insert 호출, 반환값 없음(void)
- DB 오류 경로: db.insert가 reject → `saveReport()`는 throw 없이 resolve
- `Logger.error` 호출 확인 (오류 로깅 검증)
- self-inspection-renderer.service.spec.ts 패턴 참고

---

## Phase 5: Renderer MERGED_TEXT_COL 스펙

**파일 2개**:
- `apps/backend/src/modules/checkouts/__tests__/checkout-form-renderer.service.spec.ts` (신규)
- `apps/backend/src/modules/equipment-imports/__tests__/equipment-import-form-renderer.service.spec.ts` (신규)

**목표**: 확인 문장 행이 `MERGED_TEXT_COL` 상수 경유 정확한 열 인덱스에 주입되는지 검증.

**성공 기준**:
- 최소 DOCX fixture 생성 (self-inspection spec 패턴 재사용)
- `render()` 호출 후 출력 XML에서 확인 문장 텍스트 포함 여부 검증
- `MERGED_TEXT_COL` 상수 import 후 해당 열 인덱스가 레이아웃 SSOT와 일치함을 검증
- 반출 확인 문장(checkoutConfirmText)·반입 확인 문장(returnConfirmText) 각각 테스트

---

## Verification Commands

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test -- --testPathPattern="security.service|checkout-form-renderer|equipment-import-form-renderer"
```
