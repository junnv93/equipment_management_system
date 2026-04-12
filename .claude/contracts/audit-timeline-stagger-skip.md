# 스프린트 계약: AuditTimelineFeed 가상화 스태거 재생 방지

## 생성 시점
2026-04-12T00:00:00+09:00

## Slug
`audit-timeline-stagger-skip`

## 성공 기준

### 필수 (MUST)

- [ ] **MUST1**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter frontend run build` PASS
- [ ] **MUST3**: `AuditTimelineFeed.tsx` 의 entry row 에서 `ANIMATION_PRESETS.fadeIn` 이 **조건부** 로 적용됨 — row 의 `flatIdx < VIRTUALIZATION.staggerCap` 일 때만 fadeIn 클래스 및 animationDelay 인라인 스타일이 포함
- [ ] **MUST4**: `flatIdx >= staggerCap` 인 row 는 fadeIn 없음 — `cn(..., shouldAnimate && ANIMATION_PRESETS.fadeIn, ...)` 형태
- [ ] **MUST5**: 변경 범위가 `AuditTimelineFeed.tsx` 단일 파일 (또는 상수 블록 보강 수준) — 다른 audit 파일 / 이번 세션 파일 (result-sections/InspectionFormDialog/form-template-export) 건드리지 않음
- [ ] **MUST6**: `VIRTUALIZATION.staggerCap` 상수 유지 — 매직 넘버 하드코딩 금지
- [ ] **MUST7**: animationDelay 계산 (`getStaggerDelay`) 도 조건부로 — 애니메이션이 없는 row 에는 `undefined` 또는 생략

### 권장 (SHOULD) — 루프 차단 없음

- [ ] **SHOULD1**: `ANIMATION_PRESETS.fadeIn` 이 이미 `motion-safe:` prefix 를 포함 → 방안 2 (prefers-reduced-motion) 는 추가 작업 불필요. 확인만
- [ ] **SHOULD2**: 헤더 row (kind === 'header') 는 fadeIn 미적용 상태를 유지 (기존 동작)
- [ ] **SHOULD3**: useInfiniteQuery / IntersectionObserver / 날짜 그룹 헤더 / diff 확장 UI 회귀 없음 — 수동 관찰 수준
- [ ] **SHOULD4**: tech-debt-tracker.md L18 및 L15 를 완료 마킹 (maintenance)

## 종료 조건
- 필수 전체 PASS → 성공 → main 커밋 + push
- FAIL 2회 연속 → 수동 개입
