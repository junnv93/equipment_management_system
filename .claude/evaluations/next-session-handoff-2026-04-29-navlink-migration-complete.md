# 다음 세션 핸드오프 — NavLink 시스템 전반 마이그레이션 완료

작성일: 2026-04-29  
본 세션 최종 커밋: `99f64f77` (chore(skills): verify-click-feedback Step 13 + verify-frontend-state Step 33 신설)

---

## 본 세션에서 완료한 작업

### P4-new: NavLink invisible overlay — 시스템 전반 마이그레이션

| 커밋 | 내용 |
|------|------|
| `323fc6a7` | feat(frontend): system-wide NavLink migration for list→detail navigation |
| `fb2bfe22` | fix(frontend): replace hardcoded routes with FRONTEND_ROUTES SSOT (verify-hardcoding 즉시 교정) |
| `99f64f77` | chore(skills): verify-click-feedback Step 13 + verify-frontend-state Step 33 신설 |

### 마이그레이션 적용 파일 (이번 세션)

| 파일 | 패턴 | 비고 |
|------|------|------|
| `CalibrationPlansContent.tsx` | invisible overlay `absolute inset-0` | FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL |
| `CalibrationListTable.tsx` | cell NavLink variant="card" | FRONTEND_ROUTES.EQUIPMENT.DETAIL |
| `CableListContent.tsx` | cell NavLink variant="card" | FRONTEND_ROUTES.CABLES.DETAIL |
| `TestSoftwareListContent.tsx` | invisible overlay (onClick→NavLink 전환) | router.push 제거, pendingIndicator="none" |
| `CalibrationDdayList.tsx` | pendingIndicator="opacity" + viewAll card | FRONTEND_ROUTES.EQUIPMENT.DETAIL |
| `CheckoutCard.tsx` | pendingIndicator="opacity" + viewAll card | FRONTEND_ROUTES.CHECKOUTS.DETAIL |
| `nav-link.tsx` | `children?: React.ReactNode` (optional) | invisible overlay self-closing 지원 |

### 아키텍처 패턴 확립

**Invisible overlay 패턴** (TableRow에 전체 클릭 영역 적용):
```tsx
<TableRow className="relative cursor-pointer hover:bg-muted/50">
  <TableCell>
    <NavLink
      href={FRONTEND_ROUTES.X.DETAIL(id)}
      className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
      aria-label={name}
      tabIndex={0}
      pendingIndicator="none"
    />
    <span>{visibleContent}</span>
  </TableCell>
  ...
</TableRow>
```
- GlobalProgressBar가 시스템 수준 피드백 담당
- `pendingIndicator="none"` — overlay 링크 자체에는 시각 효과 불필요 (CSS stacking context 상 opacity가 visible content에 영향 없음)

**Cell 링크 패턴** (특정 셀만 클릭 가능):
```tsx
<NavLink variant="card" href={FRONTEND_ROUTES.X.DETAIL(id)} className="...">
  {visibleContent}
</NavLink>
```

### 검증 스킬 업데이트

- **verify-click-feedback Step 13**: `pendingIndicator="none"`이 visible(비오버레이) 링크에 단독 사용되는 경우 탐지. MUST 범위 → 1-4, 7, 10-13
- **verify-frontend-state Step 33**: `<TableRow onClick={() => router.push(...)}>` 패턴 탐지 — NavLink overlay 패턴 사용 강제

---

## 미완료 / 이월 과제

### P1 — Button loading prop codemod (L2 레이어 핵심, 최우선)

**상태**: 미시작 (이전 세션에서 이월됨)

**무엇**: Click-Feedback 5-Layer L2 — `mutation.isPending`을 `<Button loading={...}>` prop으로 일괄 적용.

**도구**: ts-morph codemod `scripts/codemods/button-loading.ts`

**규모**: 35+ 호출처

**왜 중요**: L2 없으면 제출/확인 버튼이 더블클릭 가능. UX 오류 중 가장 빈번한 사용자 혼란 유발.

**시작 명령**:
```
Mode 2 harness — Button loading prop codemod
목표: apps/frontend/ 내 useXxxMutation().isPending을 Button의 loading prop으로 연결
접근: ts-morph AST 변환으로 수동 수정 없이 일괄 적용
범위: submit 버튼이 있는 모든 form 컴포넌트 (대략 35개)
```

---

### P2 — ListPageSkeleton title→showTitle API 수정 (SHOULD)

**상태**: 미시작

**변경**:
```tsx
// 전
<ListPageSkeleton title="교정 계획" description="..." />
// 후
<ListPageSkeleton showTitle showDescription />
```

**영향**: `list-page-skeleton.tsx` + 6개 `loading.tsx`

---

### P3 — FEEDBACK_KEYS.created → reportGenerated (SHOULD)

**상태**: 미시작

`useGenerateReport` onSuccess에서 `FEEDBACK_KEYS.created` → 의미상 `FEEDBACK_ROUTES.reportGenerated` 키 신설 필요.

---

### 미적용 NavLink 후보 (의도적 제외)

| 컴포넌트 | 이유 |
|----------|------|
| `CheckoutGroupCard.tsx` | FSM 기반 복잡 상태기계, `pendingCheckoutId` state 스레딩 필요 — 리스크 > 이득 |
| `PendingApprovalCard.tsx` | 대시보드 카드 수준 — GlobalProgressBar로 충분 |

향후 CheckoutGroupCard 리팩터 시 NavLink 패턴 적용 권장.

---

## 세션 시작 맨트

```
Click-Feedback NavLink 마이그레이션이 완료됐습니다.
커밋 99f64f77까지 main에 푸시된 상태입니다.

다음 세션 우선순위:
1. **P1 [최우선]**: Button loading prop codemod — L2 레이어 완성
   → `scripts/codemods/button-loading.ts` 신규 작성 (ts-morph)
   → Mode 2 harness 권장 (35+ 파일)
2. **P2 [SHOULD]**: ListPageSkeleton title → showTitle boolean API
3. **P3 [SHOULD]**: FEEDBACK_KEYS.created → reportGenerated 의미 수정

세션 시작 전:
- git log --oneline -5 (현재 커밋 확인)
- /verify-click-feedback (Step 13 포함 PASS 상태 확인)
- git stash list (미처리 stash 확인)
```

---

## 핵심 교훈 (이번 세션)

1. **SSOT 위반은 즉시 수정** — verify-hardcoding이 `/equipment/${id}` 하드코딩을 잡았고, fix 커밋이 메인 커밋 직후 즉시 필요했음. 처음부터 FRONTEND_ROUTES 사용이 정답
2. **invisible overlay의 pendingIndicator="none"이 맞는 이유** — `position: absolute; inset: 0`의 링크에 opacity를 걸어도 z-index 아래의 visible content에는 영향 없음. GlobalProgressBar가 더 나은 UX
3. **children optional화 패턴** — 인터페이스와 구현 함수 타입 모두 수정해야 함 (NavLinkProps + NavLinkInner 두 곳)
4. **시니어 기준 = 아키텍처 전반** — "이 파일만 고쳐달라"는 요청도 SSOT 위반/패턴 일관성 점검 후 범위 확장이 올바른 판단
