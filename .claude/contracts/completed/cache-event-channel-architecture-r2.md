# Contract: cache-event-channel-architecture-r2

**시작일**: 2026-05-12
**Mode**: Mode 1
**범위**: `sw-validation-event-channel-separation` sprint 시니어 자기검토 라운드 #2 — 5갭 통합 closure

## 배경

commit `06fc71d4`가 A2/A3 표면 요구를 충족(MUST 9/9). 시니어 자기검토 #2에서 5갭 식별:
1. **갭 1 (HIGH)**: SW_VALIDATION registry pattern wholesale → service-local과 100% redundant
2. **갭 2 (HIGH)**: 채널 책임 분리 정책 ADR 부재
3. **갭 3 (MED)**: dual-channel proactive audit 부재 (invariant만 reactive)
4. **갭 4 (MED)**: `cache.` prefix 명명 규약 코드 강제 없음
5. **갭 5 (LOW)**: synonym map이 listener에 인라인

## MUST 기준

### M-1: ADR-0012 신설
`test -f docs/adr/0012-cache-event-channel-responsibility.md`

### M-2: SW_VALIDATION registry wholesale 제거
- `grep -c "SOFTWARE_VALIDATIONS}\*" registry` = 0
- `grep -cE "SOFTWARE_VALIDATIONS}(list|pending|detail):\*"` >= 12

### M-3: synonym map SSOT를 cache-events.ts로 이동
- `cache-events.ts`에 `export const CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM` >= 1
- `cache-event-listener.ts`에 `^const CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM` = 0
- listener가 `import ... from './cache-events'` 으로 가져옴

### M-4: cache. prefix 명명 spec
- `cache-events-naming.spec.ts` 존재
- `pnpm exec jest cache-events-naming` PASS
- `cache-events.ts`에 `CACHE_EVENT_LEGACY_NAMING_ALLOWLIST` 존재

### M-5: audit script EXIT 0
`node scripts/audit-cache-event-channels.mjs` EXIT 0 (violations 0)

### M-6: verify-cache-events Step 8
SKILL.md에 `audit-cache-event-channels` 인용

### M-7: ADR-0012 cross-reference (cache-events.ts + registry + listener에서 인용)

### M-8: tsc/lint/test PASS

### M-9: tech-debt-tracker 갭 1-5 closure 마커

### M-10: 다른 세션 파일 stage 0건

## 다른 세션 도메인 침범 금지

`.claude/handoff/` / `saved-views` / `apps/frontend/**` (qr-visual-redesign) / `.gitleaks.toml` / `.husky/*` / `scripts/ultrareview-*` / `apps/backend/src/common/__tests__/drizzle-stub.ts` / audit + qr-access spec (qr-visual-redesign G-10)
