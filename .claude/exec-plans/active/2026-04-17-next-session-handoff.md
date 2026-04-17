# 다음 세션 인계 노트 (73~74차 → 75차)

**작성일**: 2026-04-17
**74차 세션 커밋**: `42f76fb4`, `35b0b641` (main, pushed)
**73차 세션 커밋**: `ea048c4e`, `19bc114b`, `699a7dc8`, `2716354b` (main, pushed)

---

## 73차 작업 요약

### 완료된 근본 아키텍처 수정

1. **이벤트 기반 캐시 무효화 read-after-write 일관성** — 9개 서비스 35개 `emit → emitAsync` + listener async Promise 반환
2. **equipment 캐시 키 JSON sorted keys mismatch** — `invalidateEquipmentDetail` 정규식 + helper 기반 전환
3. **file-upload i18n + form-template ENOENT graceful** — 영어 메시지 한국어화 + 500→404
4. **jest-global-setup + TEST_USER_IDS 'e2e' 접두사 + DEFAULT_EQUIPMENT.teamId** — 테스트 인프라 SSOT 강화
5. **단위/E2E 테스트 35+건 수정** — mock 업데이트, /rentals→/checkouts, casVersion 필드

### 검증 결과 (모두 PASS)

- tsc exit 0
- lint 0 errors
- Unit: 50 suites / 677 tests
- E2E: 22 suites / 286 tests (1 skipped)

---

## 차기 세션 우선 작업

### P0 — 완료 (74차에서 처리)

- ✅ 모든 커밋 push 완료 (pre-push hook 통과)
- ✅ tsc 0 errors, unit 50/50 suites 677 tests, E2E 22/22 suites 287 tests (3회 연속 동일)
- ✅ 아키텍처 리뷰 완료 — Critical 0건 (C-2 cable 경로는 사문화 코드, 동작 영향 없음)
- ✅ SSOT grep 검증: 구 UUID `f47ac10b-...`, `a1b2c3d4-...` → test/ 하위 0 matches

### P1 — 남은 기술 부채

1. **calibration-plans 서비스 자체 lint/typecheck 문제 없는지 확인**
   - 3단계 승인 플로우 수정 시 `casVersion`과 기존 `version` 혼재 가능성

2. **E2E export 500 시나리오 모니터링**
   - 우리가 ENOENT를 404로 변환했지만, 실제 운영에서 양식 파일 누락 이벤트 발생 시
     `FORM_TEMPLATE_NOT_FOUND` 에러가 프론트엔드에서 의미있게 표시되는지 검증

3. **TEST_YEAR collision 관리**
   - `calibration-plans.e2e-spec.ts`의 `TEST_YEAR = 2030 + (Date.now()/1B % 70)` 공식은
     수일 간격으로만 변함. beforeAll의 DB DELETE로 방어 중.
   - 장기 해결: `process.pid` 기반 또는 랜덤으로 완전 유니크화

### P2 — 파생 개선 기회

1. **다른 서비스의 캐시 키 정규식 점검**
   - `invalidateEquipmentDetail`과 동일한 JSON sorted keys 이슈가 다른 `deleteByPattern` 사용처에도 있을 수 있음
   - 점검 대상: `checkouts`, `calibration`, `non-conformances`, `calibration-plans` 서비스의 detail 캐시

2. **Scheduler emit 전환 검토 여부 결정**
   - `import-orphan-scheduler`, `intermediate-check-scheduler`, `checkout-overdue-scheduler`,
     `calibration-overdue-scheduler`는 현재 `emit` (fire-and-forget) 유지
   - 스케줄러는 사용자 응답 경로가 아니므로 의도적 선택. 문서화만 필요.

3. **frontend 영향 확인**
   - 이벤트 기반 캐시 무효화 개선이 SSE 리프레시 전파에 영향 있을 수 있음
   - 프론트엔드 수동 테스트 또는 Playwright E2E로 검증

---

## 주의사항 (학습 내용)

### EventEmitter2 emitAsync 함정
- `emit()` vs `emitAsync()` 차이는 **리스너가 Promise를 반환할 때만** 유효
- 기존 `on(name, (p) => handler(p).catch(...))` 패턴은 `undefined` 반환 → emitAsync도 fire-and-forget
- 반드시 `on(name, async (p) => { try { await handler(p); } catch {} })` 패턴 사용

### 캐시 키 정규식 설계
- `JSON.stringify(sortedParams)`는 알파벳 정렬 → 필드 순서 의존 regex 깨짐
- `{"uuid":"..."}` 가정 대신 `.*"uuid":"<id>"` 사용
- `normalizeCacheParams`는 `false` 유지 → boolean 파라미터는 키에 남음

### plan 스키마 특이점
- `calibration_plans` 테이블만 `casVersion` 컬럼 사용 (다른 테이블은 `version`)
- review/approve DTO는 `casVersion: number` 요구 — 테스트 작성 시 `body.casVersion` 사용

---

## 파일 구조 참고

```
.claude/
├── contracts/
│   ├── e2e-72-fixes.md          (73차 계약, 12 MUST 전체 PASS)
│   └── e2e-23-fixes.md          (예비 — 미사용)
├── evaluations/
│   └── e2e-72-fixes.md          (Evaluator 최종 보고서)
└── exec-plans/active/
    ├── 2026-04-17-next-session-handoff.md  (본 문서)
    └── 2026-04-17-e2e-23-fixes.md          (예비)

apps/backend/test/
├── jest-global-setup.ts         (신규 — 모든 E2E 전 1회 팀/사용자 시딩)
├── jest-e2e.json                ("globalSetup": "<rootDir>/jest-global-setup.ts")
└── helpers/
    ├── test-auth.ts             (TEST_USER_IDS 'e2e' 접두사 + teamId)
    └── test-fixtures.ts         (seedTestUsers 제거, DEFAULT_EQUIPMENT.teamId 추가)
```

---

## 최근 커밋 (73~74차)

```
35b0b641 refactor: globalSetup TEAMS_SEED SSOT 정렬 + file-upload ErrorCode import
42f76fb4 fix(test): 아키텍처 리뷰 대응 — users DB_URL fallback + calibration-plans casVersion/export 수정
2716354b docs: 73차 → 74차 인계 노트 추가
699a7dc8 docs: 73차 — harness 실행 산출물 (contracts/evaluations/exec-plans)
19bc114b test: 73차 — 테스트 인프라 SSOT + E2E/unit 통합 수정
ea048c4e refactor(backend): 73차 — 이벤트/캐시 일관성 + i18n + 양식 다운로드 복원력
```

75차 시작 시 `git log --oneline -10`으로 확인.
