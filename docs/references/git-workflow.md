# Git Workflow Rules (Solo Trunk-Based, 2026-04-08~)

> **CLAUDE.md에서 분리 (2026-04-09 엔트로피 정리).** 핵심 요약은 CLAUDE.md에 유지, 상세 절차는 이 문서 참조.

**핵심 원칙: 1인 프로젝트 — 기본은 main 직접 작업, 위험 작업만 브랜치**

이 프로젝트는 1인 개발 + 다중 PC + 다중 Claude 세션 환경입니다.
GitHub Flow의 PR 게이트는 협업이 없는 환경에서 오버헤드만 만들었으므로,
trunk-based로 전환했습니다. **CI 게이트는 `.husky/pre-push`로 이동**했습니다.

## 기본 모드: main 직접 작업

대부분의 작업은 main에서 직접 수행합니다:

- 논리 단위로 commit
- push 시 `pre-push` hook이 `tsc + test`를 자동 검증 → 실패하면 푸시 차단
- 다른 PC에서는 `git pull`만으로 동기화 완료

```
일반 작업 흐름:
  git pull                              # 최신 main 받기
  ...코딩...
  git add <files> && git commit         # 논리 단위로 커밋
  git push                              # pre-push hook이 검증
```

## 예외: 브랜치를 써야 하는 경우

다음 케이스에만 브랜치 + PR을 사용합니다 (월 1~2회 빈도):

| 상황                                                                   | 이유                                     |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| **DB 마이그레이션** (`drizzle/000X_*.sql` 추가)                        | 실패 시 main 전체 망가짐, 격리 검증 필요 |
| **major 의존성 업그레이드** (Next.js, NestJS, Tailwind 등 메이저 bump) | breaking change 검증 필요                |
| **광범위한 리팩토링** (50+ 파일)                                       | 단계적 검증 + 롤백 용이성                |
| **실험적 작업** (성공 여부 불확실)                                     | main 오염 방지                           |

브랜치를 만들 때만 아래 네이밍 규칙 적용:

| Prefix      | 용도                            |
| ----------- | ------------------------------- |
| `feat/`     | 새 기능 (예외적, 광범위한 경우) |
| `fix/`      | 위험한 버그 수정                |
| `chore/`    | 의존성 major bump, 마이그레이션 |
| `refactor/` | 광범위한 리팩토링               |

## 작업 시작 전 체크 (간소화)

```
1. git pull                # 항상 최신 main으로 시작
2. git status              # 다른 세션이 남긴 uncommitted 있나?
   → 있으면: 사용자에게 보고
3. 위험 작업인가? (위 표 참조)
   → Yes: 브랜치 만들고 진행
   → No: main에서 바로 시작
```

## PC 이동 후 첫 작업 (DB 상태 리셋)

**로컬 DB는 일회용(ephemeral)으로 다룹니다.** 다른 PC에서 추가된 마이그레이션/seed가 현재 PC의 로컬 DB와 어긋나면 `drizzle-kit migrate`가 말없이 hang 하거나 부분 적용 상태로 깨지는 경우가 있습니다 (2026-04-08 발생). 예방 워크플로우:

```
git pull
pnpm --filter backend run db:reset   # DROP + CREATE + migrate + seed, 약 30초
pnpm dev
```

`db:reset`은 `equipment_management` DB를 통째로 drop/recreate 하고 0부터 마이그레이션을 재적용한 뒤 `seed-test-new.ts`를 실행합니다. 수동으로 입력한 로컬 데이터는 전부 날아가므로, 보존할 데이터가 있는 PC에서는 사용하지 마세요. (이 프로젝트는 seed가 SSOT라 일반적으로 문제 없음.)

`__drizzle_migrations` 테이블과 `drizzle/meta/_journal.json`이 불일치하면 drizzle-kit migrate CLI가 에러를 출력하지 않고 스피너 상태로 멈춥니다 — 이럴 땐 `pnpm --filter backend run db:reset` 이 가장 빠른 복구 방법입니다.

## 작업 완료 시

1. `git status` + `git diff --stat`으로 변경 확인
2. 논리 단위로 commit (사용자가 명시적으로 요청 시)
3. `git push` — pre-push hook이 자동 검증
4. 검증 실패 시: **`--no-verify`로 우회 금지**, 원인 수정 후 재푸시

## pre-push hook이 실행하는 것

`.husky/pre-push`:

- `pnpm tsc --noEmit` — 타입 체크 (전 패키지)
- `pnpm --filter backend run test` — 백엔드 유닛 테스트
- `pnpm --filter frontend run test` — 프론트엔드 유닛 테스트

E2E, CodeQL, Secret Scan은 여전히 GitHub Actions에서 push 후 실행됩니다.

## 금지 사항

- `--no-verify`로 pre-push/pre-commit hook 우회 금지 (진짜 긴급 상황 + 사용자 명시 승인 시만)
- 위험 작업(위 표)을 main에 직접 커밋 금지
- 사용자 요청 범위를 넘어선 "김에 같이" 변경 금지

## SessionStart 감지 결과 해석

`.claude/settings.json`의 SessionStart hook이 출력하는 값:

- `branch=` 현재 브랜치명 — 작업 성격과 맞는지 판단
- `behind_main=N` main이 N커밋 앞섬 — N > 0이고 작업이 길어질 것 같으면 rebase 제안
- `ahead_main=N` 현재 브랜치가 N커밋 앞섬 — PR 대상이 될 커밋 수
- `upstream_gone=1` 원격 브랜치가 삭제됨 — 이미 머지되었을 가능성, 로컬 삭제 제안
- `dirty=N` uncommitted 파일 수 — N > 0이면 첫 액션 전에 확인
- `diverged=N` main과 비교한 변경 파일 수 — `ahead_main` 대비 지나치게 크면 드리프트 의심
