# Arch CI Gate + Zod Pilot 구현 계획

## 메타
- 생성: 2026-04-17T00:00:00+09:00
- 모드: Mode 2 (아키텍처 변경 + docs)
- 예상 변경: 4개 파일 (수정 4)
- Slug: arch-ci-gate-zod-pilot

## 설계 철학
envSchema SSOT를 CI 단계의 실제 SOPS 시크릿 파일까지 확장하고, nestjs-zod의 ZodResponse 파일럿으로 Zod 단일 SSOT가 Swagger/serializer/TS type 3축을 모두 덮는지 실측 검증한다. 파일럿은 최소 범위(checkouts handover 2 엔드포인트 + 컨트롤러 단위 interceptor)로 격리하여 실패 시 단일 커밋 revert로 롤백 가능.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| `--file` 플래그 파싱 | `node:util.parseArgs` | Node 20+ 기본 제공, 외부 dep 0 |
| CI SOPS 루프 | bash for-loop + step name에 파일명 | 실패 파일 식별성 |
| 파일 소스별 에러 메시지 분기 | `--file` 있으면 수정 가이드 변경 | .env.example 가이드는 pre-push만 해당 |
| ZodSerializerInterceptor 스코프 | 컨트롤러 단위 (CheckoutsController만) | 파일럿 격리, 롤백 안전성 |
| 4xx 응답 데코레이터 | `@ApiResponse` 유지, 2xx만 `@ZodResponse` | ZodResponse 2xx 전용 |
| Controller 반환 타입 | 기존 class 유지 | minimal code |
| Phase 순서 | A → C → B | B docs 갱신이 C 결과를 반영 |

## 구현 Phase

### Phase A: verify-env-sync `--file` 플래그 + CI SOPS 확장
**목표:** SOPS 복호화 결과를 envSchema에 대조하여 drift를 CI에서 포착.

**변경 파일:**
1. `scripts/verify-env-sync.ts` — 수정. `node:util.parseArgs`로 `--file <path>` 옵션 추가. 미지정 시 기존 동작(`.env.example`). 지정 시 해당 파일 스캔. 에러 메시지의 "수정 방법" 3줄을 파일 소스에 따라 분기.
2. `.github/workflows/main.yml` — 수정 (line 169~180). 단일 step을 lan/prod 2개 step으로 분리. 각 step이 decrypt → `pnpm verify:env-sync --file <tmpfile>` → 삭제.

**검증:**
```bash
pnpm verify:env-sync                                # PASS (기존 동작)
pnpm verify:env-sync --file .env.example            # PASS (self-check)
echo "UNRELATED=x" > /tmp/fake.env
pnpm verify:env-sync --file /tmp/fake.env           # FAIL (required 키 리포트)
time pnpm verify:env-sync --file .env.example       # < 2s
```

---

### Phase C: nestjs-zod ZodResponse 파일럿 (checkouts handover 2 엔드포인트)
**목표:** Zod schema 단일 SSOT가 validation + Swagger + response serialization + TS type 4축을 모두 커버함을 실측.

**변경 파일:**
1. `apps/backend/src/modules/checkouts/checkouts.controller.ts` — 수정.
   - import에 `ZodResponse`, `ZodSerializerInterceptor` from `'nestjs-zod'` 추가
   - `@Controller('checkouts')` 다음 줄에 `@UseInterceptors(ZodSerializerInterceptor)` 추가
   - `issueHandoverToken`의 CREATED `@ApiResponse` → `@ZodResponse`. 403/404 유지
   - `verifyHandoverToken`의 OK `@ApiResponse` → `@ZodResponse`. 400/401/409 유지
   - Controller 메서드 반환 타입 변경 없음

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test -- checkouts
pnpm --filter backend run test:e2e -- --testPathPattern=checkouts

# Swagger 스냅샷 diff
curl -s http://localhost:3001/api-docs-json | jq '.components.schemas.IssueHandoverTokenResponse, .components.schemas.VerifyHandoverTokenResponse' > /tmp/swagger-before.json
# (변경 후 재측정 후 diff)
```

**롤백 조건:** 단일 `feat(checkouts): ZodResponse 파일럿` 커밋으로 분리. 실패 시 `git revert` 한 번으로 원복.

---

### Phase B: DTO 결정 트리 + ZodResponse 적용 조건 문서화
**목표:** C의 성공 기준을 코드화하여 향후 전환 트리거와 피해야 할 상황을 명문화. 코드 변경 0.

**변경 파일:**
1. `docs/references/backend-patterns.md` — 수정.
   - "DTO 작성 결정 트리" 섹션에 **"기존 class-DTO 전환 조건"** 하위 섹션 추가 (10~15줄). 전환 트리거 3개: (a) `any` 사용, (b) Swagger/TS drift, (c) Zod 스키마 + DTO class 중복 정의. "모듈 작업 시에만 전환" 원칙 재강조.
   - Key Files 블록 직전에 **"ZodResponse 적용 조건"** 신설 섹션 추가 (15~20줄). 적용 트리거 + 피해야 할 상황 + 파일럿 실측 성공 기준 + Key Files 링크.

**검증:**
```bash
git diff docs/references/backend-patterns.md       # 추가만, 기존 줄 수정 없음
```

---

## 전체 변경 파일 요약

| 파일 | 변경 의도 |
|---|---|
| `scripts/verify-env-sync.ts` | `--file <path>` 플래그. `node:util.parseArgs`. 에러 메시지 분기 |
| `.github/workflows/main.yml` | SOPS decrypt step lan/prod 2개 분리 + `verify-env-sync --file` 호출 |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts` | `@UseInterceptors(ZodSerializerInterceptor)` + handover 2 엔드포인트 2xx `@ZodResponse` 전환 |
| `docs/references/backend-patterns.md` | DTO 전환 조건 + ZodResponse 적용 조건 2개 섹션 추가 |

## 커밋 분리 (Phase별)

```
Phase A:  chore(ci): verify-env-sync --file 플래그 + SOPS lan/prod 2-file 게이트
Phase C:  feat(checkouts): handover 엔드포인트 ZodResponse 파일럿
Phase B:  docs(patterns): DTO 전환 조건 + ZodResponse 적용 조건 섹션 추가
```

## 병렬 세션 충돌 방지 체크 (매 Phase 시작 시)
```bash
git fetch origin main
git log HEAD..origin/main --oneline                 # 비어 있어야 진행
git status                                           # clean 확인
```

## 의사결정 로그
- **2026-04-17**: Phase 순서 A → B → C 에서 A → C → B 로 변경. Docs "ZodResponse 적용 조건" 섹션이 Phase C의 실측 성공 기준을 포함해야 하므로 C 완료 후 작성이 타당.
- **2026-04-17**: ZodSerializerInterceptor를 컨트롤러 단위로 등록. APP_INTERCEPTOR 글로벌 사례(SiteScopeInterceptor)가 있지만 파일럿 롤백 안전성이 더 중요.
- **2026-04-17**: `--file` 파싱에 yargs/commander 미도입. Node 20+ 표준 `node:util.parseArgs` 로 외부 dep 0.
- **2026-04-17**: CI SOPS step을 lan/prod 2개로 분리. 단일 step bash for-loop도 가능하지만 GitHub Actions UI에서 실패 파일 식별을 위해.
