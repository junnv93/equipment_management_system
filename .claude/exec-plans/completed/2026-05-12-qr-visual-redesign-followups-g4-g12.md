# qr-visual-redesign 후속 G-4~G-12 통합 closure 구현 계획

## 메타
- 생성: 2026-05-12T00:00:00+09:00
- 모드: Mode 2 (Full Planner→Generator→Evaluator)
- 예상 변경: 25개 파일 (production 11 + 신규 3 + spec 2 + i18n 0 신규 + skill 1 + globals.css 1 + REGISTRY 1 + tech-debt 1 + docs 1)
- Slug: `qr-visual-redesign-followups-g4-g12`
- 트리거: 2026-05-12 sprint `qr-visual-redesign` 시니어 자기검토 라운드 #2 결과 9건 통합 ("타협 X / 누락 X / 시스템 전반 시니어 표준")

## 설계 철학

**WHAT**: 9건의 시스템 깊이 일관성 갭(SSOT 분기 / dead i18n / abnormal photo 위치 / oklch 정확도 / 성능 / spec infra / locale safety / 시각 정확도)을 단일 atomic commit으로 closure.

**WHY**: 라운드 #1 PASS 후에도 SSOT 분기(G-4)·dead key(G-5)·oklch precision(G-7) 같은 시스템적 갭이 잔존하면 다음 sprint에서 "왜 .text-mono와 헬퍼 둘 다 있죠?" 같은 회귀 반복. 시니어 자기검토 #2 패턴(`feedback_repeated_self_audit.md`) 정착.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| G-4 통합 방향 | 옵션 2: `getManagementNumberClasses()` 내부에 `.text-mono` 포함 (size SSOT 통일) | 헬퍼는 의미적 진입점(관리번호용), util은 size primitive. EquipmentCardGrid `text-xs + tracking-wider` 중복 제거. `.text-mono`의 size(13px)가 단일 SSOT. |
| G-5 처리 방향 | StatusBadge aria-label에 톤 의미 통합 (옵션 a) | dead key 제거(c) 대신 의미 부여. 스크린리더가 "정상", "긴급" 등 톤을 단어로 announce. RTL spec으로 회귀 차단. |
| G-6 처리 범위 | 항목별(외관/작동/부속) `ConditionItemCard` 인라인 photo slot. abnormal 통합 영역 → 카드별 분산. DocumentRef SSOT는 별도 sprint. | 데이터 모델 0건 변경. 사진 메타에 `slotKey` 추가 (frontend state only, 서버 payload `attachmentIds` 그대로). |
| G-7 oklch 범위 | brand-color-* 11개 + brand-color-site-* 3개 = 14개 전부 (`:root` + `.dark` 동시) + 약화 변수(weak) 동시 마이그레이션 | 시스템 일관성 — 단일 색만 oklch 시 분기. WCAG AA 4.5:1 (text)/3:1 (UI) 사전 산출 표. fallback: 모던 브라우저 oklch 직접, 미지원 시 HSL cascade. |
| G-8 rAF 제거 | ref + element.style.strokeDashoffset 직접 + CSS `transition: stroke-dashoffset {durationMs}ms linear` 일임 | React reconciliation 0회. 카운트다운 텍스트(`remainingSec`)는 별도 `setInterval` 1s tick (2 re-renders/2s). |
| G-9 memo | `React.memo(StatusBadge)` + displayName | 단일 인스턴스 비용 0. 카드 그리드 다수 인스턴스 시 미래 회귀 차단. |
| G-10 stub SSOT API | `createDrizzleQueryStub({ steps?, rows? })` + `createInsertChain()` + `createUpdateChain()` 3 helper export. | qr-access의 sequential steps 패턴이 일반적 (audit 호환). |
| G-11 마이그레이션 범위 | HandoverPickerSheet (locale-less, 핵심) + 다른 6 호출자 일괄 (`useFormatter()` 또는 `useLocale()` 명시 인자) | locale safety 시스템 invariant. CheckoutEquipmentRow는 이미 locale, 제외. |
| G-12 LabelPreview mini QR | deterministic 4×4 module grid SVG (16 cells, `static const pattern`) + foreground 토큰 | 단일 SVG, props 의존성 0. visual hint가 실제 QR과 유사. |
| 다중 세션 격리 | software-validations 도메인 0 파일 수정 | `sw-validation-event-channel-separation` 세션과 충돌 차단. |
| commit 정책 | 단일 atomic commit. `git add` 직후 `git diff --cached --stat` 검증 + `git status -s` 외부 세션 파일 0 확인. | 라운드 #2 학습. |

## 구현 Phase

### Phase 0: 측정 (Generator pre-flight)
**목표:** 9건 영향 표면 실측 + 결정 invariant 확정.

**검증:**
1. `grep -rn "getManagementNumberClasses\|text-mono" apps/frontend/components apps/frontend/lib apps/frontend/styles | wc -l` 호출자 수 확정
2. brand-color-* 14개 HSL → oklch 변환 표 산출 (수동 변환 또는 도구 1회 산출)
3. `grep -rn "toLocaleDateString\|toLocaleTimeString" apps/frontend/components` enumerate

### Phase 1: SSOT closure (G-4 + G-10)
**목표:** `.text-mono` ↔ `getManagementNumberClasses()` 단일화 + drizzle-stub 헬퍼 SSOT.

**변경 파일:**
1. `apps/frontend/lib/design-tokens/brand.ts` — `getManagementNumberClasses()` 반환값에 `text-mono` 포함, `font-mono tabular-nums` 중복 제거. tracking-wider 유지. JSDoc 갱신.
2. `apps/frontend/components/equipment/EquipmentCardGrid.tsx` — line 156 `text-xs ... tracking-wider` 중복 제거.
3. `apps/backend/src/common/__tests__/drizzle-stub.ts` — **신규** SSOT helper. `createDrizzleQueryStub({ steps?: Array<unknown[]> })` + `createInsertChain()` + `createUpdateChain()`. fluent chain(from/innerJoin/leftJoin/where/orderBy/groupBy/limit/offset) 지원 + thenable resolve.
4. `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts` — `makeDbStub` 로컬 헬퍼 제거 → SSOT import.
5. `apps/backend/src/modules/audit/__tests__/audit.service.spec.ts` — 로컬 헬퍼 → SSOT import.

**검증:**
- `pnpm tsc --noEmit` EXIT=0
- `grep -c "text-mono" apps/frontend/lib/design-tokens/brand.ts` ≥ 1
- `grep -rn "text-xs.*tracking-wider\|tracking-wider.*text-xs" apps/frontend/components/equipment/EquipmentCardGrid.tsx` = 0
- `pnpm --filter backend run test -- qr-access.service.spec.ts audit.service.spec.ts` PASS

### Phase 2: i18n + a11y (G-5 + G-11)
**변경 파일:**
1. `apps/frontend/components/ui/StatusBadge.tsx` — aria-label에 톤 i18n 결합 (`useTranslations('qr.statusBadge')` 추가).
2. `apps/frontend/components/ui/__tests__/StatusBadge.test.tsx` — **신규** RTL spec (8 status × tone aria-label).
3. `apps/frontend/components/mobile/HandoverPickerSheet.tsx` — `useFormatter()` 또는 `useLocale()` 후 명시 인자.
4. `apps/frontend/components/form-templates/FormTemplateHistoryDialog.tsx` — locale 명시
5. `apps/frontend/components/form-templates/FormTemplatesTable.tsx` — locale 명시
6. `apps/frontend/components/form-templates/FormTemplatesArchivedTable.tsx` — locale 명시 (3 site)
7. `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx` — locale 명시
8. `apps/frontend/components/equipment/NonConformanceBanner.tsx` — locale 명시
9. `apps/frontend/components/ui/auto-save-status.tsx` — locale 명시
10. `.claude/skills/verify-hardcoding/SKILL.md` — locale 강제 Step (allow-list: RepairHistoryTimeline ko-KR 의도적).

### Phase 3: 디자인 polish (G-7 + G-12)
**변경 파일:**
1. `apps/frontend/styles/globals.css` — `:root` + `.dark`의 `--brand-color-*` 14개 oklch 좌표 변환. `--brand-urgent-weak` / `--brand-mute-weak` 도 oklch.
2. `apps/frontend/lib/design-tokens/brand.ts` — JSDoc 갱신 (oklch 명시).
3. `apps/frontend/components/equipment/EquipmentQRButton.tsx` — `LabelPreviewRow` 4×4 module grid SVG로 교체. 16 cell `PREVIEW_QR_PATTERN` const.
4. `docs/design/oklch-migration-2026-05-12.md` — **신규** 14 color oklch ↔ HSL 표 + WCAG AA 대비비 산출물.

### Phase 4: 성능 (G-8 + G-9)
**변경 파일:**
1. `apps/frontend/components/mobile/AutoProgressCountdown.tsx` — rAF tick + `setElapsed` 제거. SVG circle `ref` + `style.strokeDashoffset` 직접 + CSS `transition`. 카운트다운 텍스트는 `setInterval(1000ms)`. reduced-motion 분기 보존.
2. `apps/frontend/components/ui/StatusBadge.tsx` — `React.memo(StatusBadgeImpl)` + `displayName`.

### Phase 5: UX 재배치 (G-6)
**변경 파일:**
1. `apps/frontend/components/checkouts/EquipmentConditionForm.tsx` — 통합 abnormal block 해체. `ConditionItemCard`에 `photoSlot?: React.ReactNode` prop 추가. abnormal 시 카드 내부 FileUpload + textarea. `slotKey` 메타 (frontend only). 서버 payload `attachmentIds` 그대로.

### Phase 6: 검증
1. `pnpm tsc --noEmit` EXIT=0
2. `pnpm --filter backend run build` EXIT=0
3. `pnpm --filter frontend run build` EXIT=0
4. `pnpm --filter backend run test` PASS
5. `pnpm --filter frontend run test` PASS
6. `pnpm lint` EXIT=0
7. verify-implementation skills PASS
8. review-architecture skill — CRITICAL/HIGH 0
9. ko/en i18n parity diff = 0

## 의사결정 로그

- **2026-05-12 P-1**: G-4 옵션 2 — 헬퍼는 의미적 진입점, size SSOT는 `.text-mono`.
- **2026-05-12 P-2**: G-7 범위 14 color (실측, 사용자 가이드 9→실측 14) — 시스템 일관성 정당화.
- **2026-05-12 P-3**: G-11 범위 확장 — locale safety 시스템 invariant.
- **2026-05-12 P-4**: G-6 데이터 모델 0건 — frontend state slotKey 메타만.
- **2026-05-12 P-5**: G-8 setInterval 1s 분리 — rAF 제거 후 텍스트 reactive.
- **2026-05-12 P-6**: software-validations 0 파일 — 세션 격리.
- **2026-05-12 P-7**: oklch HSL fallback — `:root`의 두 정의 또는 cascade 결정은 Generator 선택.
