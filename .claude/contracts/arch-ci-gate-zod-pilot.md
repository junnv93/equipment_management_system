# 스프린트 계약: Arch CI Gate + Zod Pilot

## 생성 시점
2026-04-17T00:00:00+09:00

## Slug
arch-ci-gate-zod-pilot

## 범위
3건 이월 과제:
- **A**: `verify-env-sync --file` 플래그 + CI SOPS decrypt 실측 검증 (lan/prod 2파일)
- **B**: `backend-patterns.md`에 "기존 class-DTO 전환 조건" + "ZodResponse 적용 조건" 섹션 추가 (docs only)
- **C**: `nestjs-zod` ZodResponse 파일럿 — CheckoutsController handover 2 엔드포인트

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

**전체 품질 게이트:**
- [ ] M-1: `pnpm tsc --noEmit` 전체 exit 0 (backend + frontend + packages)
- [ ] M-2: `pnpm --filter backend run lint:ci` 에러 0건
- [ ] M-3: `pnpm --filter backend run test` 전체 PASS, 기존 suite/test 수 대비 회귀 없음
- [ ] M-4: `pnpm --filter backend run test:e2e -- --testPathPattern=checkouts` 전체 PASS
- [ ] M-5: `git status` clean (모든 변경 커밋됨)
- [ ] M-6: 브랜치 `main` 유지, 새 브랜치 생성 없음
- [ ] M-7: 신규 `any` 타입 0건
- [ ] M-8: 하드코딩 0건 — 시나리오/required 키는 envSchema 파생, SOPS 파일 목록은 워크플로에 명시
- [ ] M-9: 신규 `eslint-disable` 주석 0건

**과제 A — verify-env-sync --file + CI SOPS 확장:**
- [ ] M-A1: `scripts/verify-env-sync.ts`에 `node:util.parseArgs` 기반 `--file <path>` 옵션 파싱 존재. 기본값 `.env.example`.
- [ ] M-A2: 플래그 미지정 시 실행 시간 < 1s (기존 baseline).
- [ ] M-A3: `--file <path>` 지정 시 실행 시간 < 2s.
- [ ] M-A4: `--file` 사용 시 에러 메시지의 "수정 방법" 가이드가 `.env.example` 가정을 하지 않도록 분기.
- [ ] M-A5: required 키 집합 / ENV_SYNC_SCENARIOS 목록이 `env.validation.ts`에서 동적으로 파생됨 — 스크립트 하드코딩 0건.
- [ ] M-A6: `.github/workflows/main.yml`의 SOPS decrypt step이 lan/prod 2개 파일을 **모두** 검증. step name에 파일명 포함.
- [ ] M-A7: 복호화된 파일은 `$RUNNER_TEMP` 하위 tmpfile. step 말미 `rm` 삭제. `actions/upload-artifact` 0건.
- [ ] M-A8: `if: ${{ secrets.SOPS_AGE_KEY != '' }}` 가드 유지.

**과제 B — 문서 갱신:**
- [ ] M-B1: backend-patterns.md에 **"기존 class-DTO 전환 조건"** 하위 섹션 존재. 3개 트리거: (a) `any`, (b) Swagger/TS drift, (c) Zod 스키마 + DTO class 중복.
- [ ] M-B2: "리팩터를 위한 리팩터 금지 — 해당 모듈 작업 시에만 전환" 원칙 재명시.
- [ ] M-B3: **"ZodResponse 적용 조건"** 신설 섹션 존재. 적용 트리거 + 피해야 할 상황 + 실측 성공 기준 + Key Files 링크.
- [ ] M-B4: 추가 분량 +25~40줄, 기존 줄 수정 없음 (append only).
- [ ] M-B5: 코드 변경 0건 — `.ts/.tsx/.js/.mjs/.json` diff 없음.

**과제 C — ZodResponse 파일럿:**
- [ ] M-C1: `CheckoutsController`에 `@UseInterceptors(ZodSerializerInterceptor)` 1회 적용. 다른 컨트롤러/글로벌 변경 0.
- [ ] M-C2: `POST /checkouts/:uuid/handover-token` CREATED 응답 `@ZodResponse`로 전환. 403/404 유지.
- [ ] M-C3: `POST /checkouts/handover/verify` OK 응답 `@ZodResponse`로 전환. 400/401/409 유지.
- [ ] M-C4: **Swagger 스냅샷 diff**: 변경 전/후 `/api-docs-json`의 `IssueHandoverTokenResponse` / `VerifyHandoverTokenResponse`에서 `properties`/`required`/`enum` 동일. `$ref`/`additionalProperties` 편차는 기록만.
- [ ] M-C5: Controller 메서드 반환 타입 변경 0 (minimal code).
- [ ] M-C6: checkouts unit + E2E 전수 PASS. 기존 테스트 수정 0건.
- [ ] M-C7: ZodSerializerInterceptor와 기존 ErrorInterceptor/LoggingInterceptor 실행 순서 충돌 없음.
- [ ] M-C8: 응답 지연 증가 < 5ms (E2E 타임아웃 회귀 없음으로 간접 검증).
- [ ] M-C9: Phase C 단일 커밋으로 분리하여 `git revert` 한 번 롤백 가능.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] S-1: `infra/secrets/README.md` "ENV SSOT 동기화 체크리스트"에 `--file` 사용법 1줄 추가.
- [ ] S-2: ZodSerializerInterceptor 글로벌 승격 조건(파일럿 2주 무회귀 + 3개 컨트롤러 적용 후)을 tech-debt-tracker에 등록.
- [ ] S-3: Swagger JSON의 nullable/additionalProperties/$ref 편차 세부 기록.
- [ ] S-4: `verify-env-sync --file` 사용 예시를 CLAUDE.md 또는 infra/secrets/README.md에 추가.

### 적용 verify 스킬
- `verify-zod` (Phase C)
- `verify-ssot` (Phase A)
- `verify-hardcoding` (Phase A)
- `verify-security` (Phase A — artifact 금지, tmpfile 수명)
- `verify-implementation` (전 Phase)

### 실패 즉시 롤백 조건 (Phase C 전용)
- Swagger `/api-docs-json` 스냅샷의 `properties` 또는 `required` 레벨 불일치
- ZodSerializerInterceptor와 ErrorInterceptor 충돌로 HTTP 응답 shape 회귀
- checkouts E2E 신규 FAIL (Phase C 원인)
- nestjs-zod 5.3.0 `Dto.Output` 요구사항 발현

### 커밋 규율
- [ ] C-1: Conventional Commits 한국어 본문 (`chore(ci):`, `feat(checkouts):`, `docs(patterns):`)
- [ ] C-2: Phase별 커밋 분리 (총 3개)
- [ ] C-3: pre-commit (gitleaks) 통과
- [ ] C-4: pre-push (env-sync + tsc + backend test + frontend test) 통과
- [ ] C-5: `--no-verify` 0건

## 병렬 세션 충돌 방지
매 Phase 시작 시 `git fetch origin main && git log HEAD..origin/main --oneline` 실행 후 비어 있음 확인. 새 원격 커밋 있으면 즉시 STOP.

## 종료 조건
- 필수 기준 전체 PASS → 완료
- 동일 이슈 2회 연속 FAIL → Planner 재진입
- 3회 반복 초과 → 수동 개입
- Phase C Swagger diff FAIL → C만 revert, A/B는 독립 유지

## 가드레일 재확인
- [x] SSOT: envSchema / createZodDto / shared-constants 경유
- [x] 하드코딩 0
- [x] 성능: `--file` < 2s, ZodResponse < 5ms 증가
- [x] 보안: tmpfile만, artifact 업로드 금지
- [x] 접근성: 해당 없음 (백엔드/인프라/문서)
- [x] 워크플로: pre-push + CI 통과 후 커밋, `--no-verify` 금지

## 참고 파일

### 수정 대상
- `scripts/verify-env-sync.ts`
- `.github/workflows/main.yml` (line 169~180)
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` (line 1~16 import, 82, 117~121, 185~189)
- `docs/references/backend-patterns.md` (DTO 결정 트리 섹션 + Key Files 전)

### SSOT 참조 (읽기만)
- `apps/backend/src/config/env.validation.ts`
- `apps/backend/src/modules/checkouts/dto/handover-token.dto.ts`
- `apps/backend/src/main.ts`

### 인프라
- `infra/secrets/lan.env.sops.yaml`
- `infra/secrets/prod.env.sops.yaml`
- `.husky/pre-push`
