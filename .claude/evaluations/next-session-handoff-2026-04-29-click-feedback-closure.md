# 다음 세션 핸드오프 — Click-Feedback 5-Layer 완료 + 후속 과제

작성일: 2026-04-29  
본 세션 최종 커밋: `2c256f28` (chore(skills): verify-click-feedback 강화)

---

## 본 세션에서 완료한 작업

### Click-Feedback 5-Layer Fix Loop (4회 반복 끝 PASS)

| 커밋 | 내용 |
|------|------|
| `14dc8a5` | fix-loop 1: cables/software loading 마이그, hooks Korean, animate-spin 6건, loading a11y 4건 |
| `318f05f` | fix-loop 2: loading a11y Group A(3)+B(6), ListPageSkeleton srLabel 분리, FEEDBACK_KEYS.unknownError |
| `23e7c64` | fix-loop 3: use-notifications 하드코딩 toast (notificationAllRead/Deleted 신설) |
| `c1db996` | fix-loop 4: use-reports 하드코딩 toast (reportFileDownloaded 신설) |
| `2c256f2` | verify-click-feedback Step 1 [가-힣] Unicode 범위 + Step 11/12 신설 + manage-skills 등록 |

### 최종 상태
- **loading.tsx**: 52개 전체 `role="status"` 또는 RouteLoading 준수
- **FEEDBACK_KEYS**: 46키 (ko/en 완전 일치), unknownError/notificationAllRead/notificationDeleted/reportFileDownloaded 신설
- **hooks**: use-form-submission, use-mutation-with-refresh, use-notifications, use-reports 모두 FEEDBACK_KEYS 경유
- **motion-safe**: components/ hooks/ 전체 `motion-safe:animate-spin` 준수

---

## 다음 세션 우선순위

### P1 — Phase 4a: Button codemod (미완성 핵심 레이어)

**무엇**: Click-Feedback 5-Layer L2(Button loading prop) — 기존 Button 호출처에 `loading` prop을 일괄 추가하는 ts-morph codemod.

**파일**: `scripts/codemods/button-loading.ts` (미생성)

**내용**:
```
목표: mutationObj.isPending → <Button loading={mutationObj.isPending}>
대상: apps/frontend/ 내 mutation hook의 isPending을 Button에 직접 전달하지 않는 35+ 호출처
도구: ts-morph + AST 변환
```

**왜 중요**: L1(loading.tsx), L3(useOptimisticMutation), L4(useDebouncedSearch) 완성됐지만 L2(Button-level isPending)가 없으면 제출 버튼이 더블클릭 가능 상태 유지.

---

### P2 — ListPageSkeleton API 설계 수정 (SHOULD)

**현재 문제**: `title?: string`이 두 역할 혼용 — 시각적 skeleton 행 표시 + (과거) ARIA 레이블.  
지금은 ARIA 분리됐지만 API가 여전히 Korean 문자열을 받아 다음 개발자가 오해 가능.

**올바른 설계**:
```tsx
// 변경 전
<ListPageSkeleton title="교정 계획" description="..." />

// 변경 후
<ListPageSkeleton showTitle showDescription />
// title/description prop 제거, boolean으로 시각적 행 제어만
```

**영향 파일**:
- `apps/frontend/components/ui/list-page-skeleton.tsx` — props 변경
- 6개 loading.tsx (calibration-plans, equipment, calibration, non-conformances, teams, admin/audit-logs) — `title="..."` → `showTitle`

---

### P3 — FEEDBACK_KEYS.created 의미 수정 (SHOULD)

**현재**: `useGenerateReport` onSuccess에 `FEEDBACK_KEYS.created` 사용 → "생성됐습니다" (CRUD create 의미)  
**올바른**: `FEEDBACK_KEYS.reportGenerated` 신설 또는 `FEEDBACK_KEYS.exported` 재사용 (보고서 다운로드 문맥에 적합)

---

### P4 — checkouts 관련 미완료 작업 (별도 세션)

`git stash@{4}` — `wip-service-3args` 스태시 존재. 내용 확인 후 처리 여부 결정.

---

## 세션 시작 맨트

```
Click-Feedback 5-Layer 작업이 PASS로 완료됐습니다.

다음 작업 우선순위:
1. **Phase 4a**: `scripts/codemods/button-loading.ts` — ts-morph codemod로 Button isPending 일괄 적용 (L2 레이어 완성)
2. **ListPageSkeleton 리팩터**: `title?: string` → `showTitle?: boolean` (API 설계 불명확 수정)
3. `FEEDBACK_KEYS.created` → `reportGenerated` 키로 의미 수정

시작 전 실행:
- `git log --oneline -5` — 마지막 커밋 확인
- `git stash list` — stash@{4} wip-service-3args 내용 확인
- `/verify-click-feedback` — 기존 PASS 상태 유지 확인

Mode 1 harness로 각 P1/P2를 개별 진행합니다.
```

---

## 핵심 교훈 (이번 세션)

1. **하드코딩 스캔은 Unicode 범위로** — `[가-힣]` 대신 특정 키워드 목록으로 쓰면 반드시 누락 발생
2. **fix loop 4회 = 초기 사전 스캔 미실시** — Phase 3 출하 전 `grep -rn "toast({" apps/frontend/hooks/` 한 번으로 4라운드 예방 가능했음
3. **API 단일 책임** — `title` prop이 "시각적 제어"와 "ARIA 레이블"을 동시에 담당하면 i18n 경계에서 반드시 깨짐
