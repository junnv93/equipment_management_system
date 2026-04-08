# Contract — WF-25 alert → equipment detail → checkout cross-flow E2E

**Slug**: `wf-25-alert-to-checkout`
**Mode**: 1 (Lightweight)
**Date**: 2026-04-08

## Scope

Single new spec file:
- `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts`

No production code changes. No fixture changes. No seed changes.

## Context (verified facts)

- `/alerts` 페이지에는 "교정 임박" 전용 탭이 **없음**. 알림은 `notification.linkUrl` 기반 라우팅(`AlertsContent.tsx:199-210`).
- 장비 상세 "반출 신청" 버튼: `EquipmentStickyHeader.tsx:236-242` → `${FRONTEND_ROUTES.CHECKOUTS.CREATE}?equipmentId=${equipmentId}`. TE는 `Permission.CREATE_CHECKOUT` 보유.
- Prefill 메커니즘: `CreateCheckoutContent.tsx:80,100-110` — `searchParams.get('equipmentId')` → `useQuery` → `setSelectedEquipments`. 선택된 장비는 `Card`로 렌더링되며 `equipment.managementNumber`(line 579)와 제거 버튼 `aria-label="...removeEquipment"`(line 587)이 셀렉터 후보.
- Default purpose: `'calibration'` (line 88).
- TE fixture: `testOperatorPage` (`auth.fixture.ts:90-96`).
- 시드는 calibration_due 알림을 결정적으로 보장하지 않음(`alert-kpi.spec.ts`의 `if (isAlert)` 패턴 참조).

## Design decisions

1. **Submit은 수행하지 않는다.** WF-03이 이미 전체 체크아웃 생성/승인 사이클을 cover. WF-25의 고유 가치는 "alert 진입 → prefill" cross-flow 경계. 제출 시 WF-03 등 다른 spec과 데이터 간섭 위험.
2. **알림 미존재 시 `test.skip`** — 결정적 시딩 부재 시 fail-loud 대신 skip + 명시적 메시지(`alert-kpi.spec.ts` TC-13 패턴 답습).
3. **알림 진입 경로**: `/alerts`에서 첫 번째 `linkUrl`이 `/equipment/`로 시작하는 알림의 "상세 보기" 링크 클릭. (calibration_due 외에도 equipment를 가리키는 알림 모두 포함)

## MUST criteria

- [ ] 신규 파일 1건만 추가, 다른 코드/시드/픽스처 수정 없음
- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] `pnpm --filter frontend exec playwright test wf-25-alert-to-checkout` exit 0 (skip 포함 PASS)
- [ ] 회귀: `pnpm --filter frontend exec playwright test alert-kpi` 통과 유지
- [ ] 셀렉터는 `getByRole`/`getByText`/`getByLabel` 우선 (CSS 셀렉터 최소화)
- [ ] 도메인 데이터 fabricate 금지 (한국어 라벨/관리번호 형식 추측 금지)
- [ ] testOperatorPage fixture 사용 (TE 역할)
- [ ] prefill 검증: `equipment.managementNumber` 또는 제거 버튼 `aria-label`로 선택된 장비가 화면에 존재함을 단언

## SHOULD criteria

- [ ] 알림이 없을 때 skip 메시지가 진단 가능한 형태("seed에 equipment 알림 없음" 등)
- [ ] 단계별 `await expect(page).toHaveURL(...)` 어설션으로 라우팅 경계 명확화
- [ ] 교정 D-day 배지 존재 시 soft 검증(없어도 fail 아님)

## Out of scope

- 체크아웃 제출 및 pending 토스트 (의도적 제외 — 위 design decision 1)
- 시드 데이터 추가/수정
- AlertsContent/CreateCheckoutContent 컴포넌트 변경
