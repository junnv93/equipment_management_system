---
slug: checkout-ux-u04-inline-reject-presets
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-04
---

# Contract: Sprint 4.5 · U-04 — 인라인 반려 사유 + 프리셋 chips

## Context

V2 §8 U-04: 반려 시 모달 오픈 → 컨텍스트 전환 비용. 인라인 expand로 **행 아래 expand** + 자주 쓰는 사유 chip.

- **프리셋은 설정 기반**: 하드코딩 금지 — 서버 `GET /checkouts/rejection-presets` (role별). MEMORY.md `feedback_no_fabricate_domain_data` 준수.
- **키보드**: Esc 취소, Ctrl+Enter 전송.
- **모바일 fallback**: <640px에서는 full-screen Sheet drawer.

---

## Scope

### 신규 생성
- `apps/frontend/components/checkouts/ReturnReasonInline.tsx` — 행 아래 expand 영역. presets chip + `<textarea>` + 제출 버튼.
- `apps/frontend/hooks/use-rejection-presets.ts` — `GET /checkouts/rejection-presets` fetch (React Query, staleTime LONG).
- `apps/backend/src/modules/checkouts/dto/rejection-preset.dto.ts`
- `apps/backend/src/modules/checkouts/rejection-presets.service.ts` (또는 settings 모듈 통합)

### 수정 대상
- **Backend**
  - `checkouts.controller.ts` — `GET /checkouts/rejection-presets?role=:role` 엔드포인트. 또는 `settings` 모듈에 흡수.
  - DB seed: `rejection_presets` 테이블 또는 `settings.checkouts.rejection_presets` JSON 열. role별 기본 5개 (일정 부적합 / 기기 점검 중 / 서류 미비 / 중복 신청 / 기타).
    - **사용자 원문 확인 필요** (MEMORY.md) — 본 contract는 seed 틀만 제공, 실제 텍스트는 사용자 확인 후 확정.
- **Frontend**
  - `CheckoutGroupCard.tsx` / `CheckoutDetailClient.tsx` — 기존 "반려" 모달 경로를 `<ReturnReasonInline>`으로 교체. 모바일은 shadcn `Sheet` fallback.
  - `lib/api/query-config.ts` — `queryKeys.checkouts.resource.rejectionPresets({ role })`.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.reject.inline.placeholder`
    - `checkouts.reject.inline.submit` / `cancel`
    - `checkouts.reject.inline.presetLabel`
    - `checkouts.reject.inline.minLength` ("사유는 최소 5자 이상")

### 수정 금지
- `POST /checkouts/:id/reject` API 본체 (기존 reason 필드 재사용).
- 승인 플로우.

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `ReturnReasonInline.tsx` 신규 파일 + named export | grep |
| M3 | `GET /checkouts/rejection-presets` 엔드포인트 + `PermissionsGuard` | grep |
| M4 | 프리셋은 서버 응답 기반 — FE 하드코딩 0 | grep (role별 대체 텍스트 검색) |
| M5 | 프리셋 chip 클릭 시 `<textarea>`에 자동 주입 + 추가 편집 가능 | E2E |
| M6 | `Esc` 키 = 취소, `Ctrl+Enter` = 전송 | keyboard E2E |
| M7 | 모바일 (<640px) 감지 시 shadcn `Sheet` fallback | E2E + viewport |
| M8 | Role별 프리셋 로드: `use-rejection-presets.ts`가 current user role을 query param으로 전달 | grep |
| M9 | 최소 사유 길이(5자) FE 검증 + BE Zod 검증 | E2E + unit test |
| M10 | `queryKeys.checkouts.resource.rejectionPresets({ role })` — staleTime LONG preset (프리셋은 자주 바뀌지 않음) | grep |
| M11 | 인라인 expand 시 row `aria-expanded` + `aria-controls` | axe |
| M12 | DB seed에 최소 3개 기본 프리셋 (실제 텍스트는 사용자 확인 후 확정 — 본 contract는 seed 틀 자리 표시자로 TBD) | grep |
| M13 | i18n 5+ 키 양 로케일 | `jq` |
| M14 | E2E: preset 클릭 → textarea 주입 → Ctrl+Enter → reject API 호출 → row status 전환 | Playwright |
| M15 | `api-endpoints.ts`에 `REJECTION_PRESETS` 상수 등록 | grep |
| M16 | 변경 파일 수 ≤ **10** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 프리셋 사용 빈도 수집 (서버) → 자주 쓰는 순 자동 정렬 | `reject-preset-mru` |
| S2 | Admin이 preset CRUD 가능한 관리 UI | `reject-preset-admin-ui` |
| S3 | 사유 입력 중 자동 저장 (localStorage draft, 새로고침 대비) | `reject-reason-draft` |
| S4 | Bulk reject (U-01 연계) 시에도 동일 inline 형태 | `bulk-reject-inline` |
| S5 | Markdown 미리보기 지원 | `reject-markdown` |
| S6 | 반려 사유 템플릿 변수 `{equipmentName}` 등 placeholder 치환 | `reject-preset-templating` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/components/checkouts/ReturnReasonInline.tsx

test -f apps/frontend/components/checkouts/ReturnReasonInline.tsx && echo "inline OK"

grep -rn "rejection-presets\|rejectionPresets" apps/backend/src/modules/checkouts/ apps/frontend/hooks/

jq '.checkouts.reject.inline' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 10

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u04-inline-reject
```

---

## Acceptance

MUST 16개 PASS + E2E inline reject 흐름 통과 + 사용자가 프리셋 실제 텍스트 확정.
SHOULD 미달 항목 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-01 · Bulk — preset chip 공유.
- Sprint 4.5 U-05 · Undo — 반려도 5초 undo 가능.
- Sprint 4.5 U-09 · D-day 색온도 — 반려 사유 기한 정보 연계(선택).
- MEMORY.md `feedback_no_fabricate_domain_data` — preset 실제 텍스트는 사용자 확인 필수.
