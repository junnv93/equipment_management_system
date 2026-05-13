# Contract: cache-event-arch-r4

**시작일**: 2026-05-13
**Mode**: Mode 1
**범위**: `cache-event-arch-r3` 시니어 자기검토 라운드 #4 — 4갭 통합 closure

## 배경

라운드 #3에서 LEGACY allowlist 패턴으로 wholesale 21건 명시 + audit script 통합 완료. 그러나 자기검토 #4 발견:

- **R1 (HIGH)**: LEGACY 21건 tech-debt 미등록 — 영구 방치 sanction 위험
- **R3 (MED)**: audit script ↔ naming spec 검출 로직 DRY 위반 (drift 가능)
- **R5 (MED)**: TEST_SOFTWARE_REVALIDATION 양채널 emit이 atomic 아님 (부분 실패 silent)
- **R8 (LOW)**: audit script wholesale regex가 raw string 패턴 못 catch

## 영향 범위 (5~7 파일)

| 파일 | 변경 |
|------|------|
| `.claude/exec-plans/tech-debt-tracker.md` | LEGACY 21건 → 도메인별 마이그레이션 sprint 5건 등록 (cache-wholesale-migration-checkouts/-equipment-imports/-inspection-templates/-calibration-factors/-other-legacy) (R1) |
| `apps/backend/src/modules/test-software/test-software.service.ts` | Promise.allSettled로 양채널 emit 묶음 + 부분 실패 명시 로깅 (R5) |
| `scripts/audit-cache-event-channels.mjs` | wholesale regex 강화 — `${PREFIX}*` + raw string `'<domain>:*'` 양쪽 catch (R8) |
| `apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts` | (a) audit script child_process 실행 + exit code 검증 (R3), (b) 기존 jest 검증 유지 (방어 다층) |
| `apps/backend/src/modules/test-software/__tests__/test-software.service.spec.ts` (있을 때) | revalidation 양채널 emit assertion 보강 (R5 회귀 차단) |
| `docs/adr/0012-cache-event-channel-responsibility.md` | §References에 LEGACY 21건 tech-debt link + atomic emit 한계 명시 |

## MUST 기준

### M-1: tech-debt-tracker에 LEGACY 마이그레이션 도메인별 sprint 5건 등록 (R1)

```bash
grep -cE "cache-wholesale-migration-(checkouts|equipment-imports|inspection-templates|calibration-factors|other-legacy)" .claude/exec-plans/tech-debt-tracker.md
# >= 5
```

### M-2: TEST_SOFTWARE_REVALIDATION emit Promise.allSettled (R5)

```bash
grep -cE "Promise\.allSettled" apps/backend/src/modules/test-software/test-software.service.ts
# >= 1
grep -cE "revalidation.*partial.*failure|allSettled.*revalidation" apps/backend/src/modules/test-software/test-software.service.ts
# >= 1 (부분 실패 명시 로깅)
```

### M-3: audit script wholesale regex 강화 (R8)

```bash
# raw string wholesale도 catch
grep -cE "raw string|raw wholesale|pattern:\s*\['\"\`]\[\^'\"\`\]+:\\\\\*" scripts/audit-cache-event-channels.mjs
# >= 1
```

### M-4: naming spec이 audit script child_process로 실행 (R3 DRY)

```bash
grep -cE "child_process|spawnSync|execSync" apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts
# >= 1
grep -cE "audit-cache-event-channels" apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts
# >= 1
```

### M-5: ADR-0012 갱신 (LEGACY tech-debt link + atomic emit 한계)

```bash
grep -cE "cache-wholesale-migration|Promise\.allSettled|atomic emit 한계" docs/adr/0012-cache-event-channel-responsibility.md
# >= 1
```

### M-6: tsc + lint + jest + audit 전부 PASS

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend exec jest --testPathPattern='(cache-event|test-software.service)'
node scripts/audit-cache-event-channels.mjs # EXIT 0
```

### M-7: 다른 세션 도메인 무수정

```bash
git diff --cached --name-only | grep -E "saved-views|drizzle-stub|qr-access|orphan-photo|EquipmentActionSheet|EquipmentLanding|qr-handover|equipment-api|use-equipment-by-management|StatusBadge\.test|admin/audit-logs"
# 빈 결과
```

### M-8: tech-debt-tracker 라운드 #4 closure 마커

```bash
grep -cE "cache-event-arch-r4|라운드 #4" .claude/exec-plans/tech-debt-tracker.md
# >= 1
```
