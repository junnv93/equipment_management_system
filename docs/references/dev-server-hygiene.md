# Dev Server Hygiene — 좀비 프로세스 + 매니페스트 desync 복구 SSOT

**대상**: `pnpm dev` 사용 중 `/login`이 404를 반환하거나 `/api/auth/session`이 ClientFetchError(`Unexpected token '<'`) 발생 시.

이 문서는 증상 → 원인 → 복구 → 예방 4단계로 구성됩니다. 단편 fix가 아닌 워크플로 차원의 SSOT입니다.

> **2026-04-28 업데이트 (ADR-0006 정착)**: backend 콘솔의 `Cannot GET /api/auth/csrf|session|providers|signin|signout|callback` 404 증상은 ADR-0006 (Same-Origin Reverse-Proxy 모델)로 종결되었습니다. 본 증상이 재발하면 라우팅 모델 회귀이며, [docs/references/api-routing-architecture.md §6 트러블슈팅](api-routing-architecture.md#6-트러블슈팅)을 우선 점검하세요.

---

## 1. 증상 (Symptoms)

| 관찰                                                                                            | 의미                                                                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 브라우저: `[browser] ClientFetchError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` | NextAuth가 `/api/auth/session`을 호출했지만 HTML(404 페이지) 응답을 받음. JSON 기대값과 불일치 |
| dev 콘솔: `GET /login 404`, `GET /api/auth/session 404`                                         | Next.js 자체에서 라우트 미발견                                                                 |
| dev 콘솔: backend `NotFoundException: Cannot GET /api/auth/csrf`                                | Next.js 라우트 미등록으로 frontend rewrite fallback이 backend로 전달                           |
| `curl -s http://localhost:3000/login` 본문에 `404` + `not-found` 마커                           | `app/not-found.tsx`가 렌더링됨 (앱 라우터가 `(auth)/login` 매칭 실패)                          |

---

## 2. 근본 원인 (Root Cause)

### 2.1 직접 원인 — 매니페스트 desync

Next.js dev 서버는 라우트별 매니페스트를 lazy-compile 후 글로벌 `app-paths-manifest.json`에 등록합니다. Turbopack의 cacheComponents 모드(또는 다중 인스턴스 동시 쓰기)에서 이 등록이 race condition으로 누락되면, 파일은 컴파일되어 있지만 라우터에서 매칭되지 않아 404가 발생합니다.

### 2.2 워크플로 원인 — 좀비 dev 프로세스

세션 종료/PC 이동/터미널 강제 종료 시 `turbo run dev`가 자식 프로세스(`next dev`, `nest start --watch`)를 정리하지 못하고 끝나는 경우가 있습니다. 이후 새로운 `pnpm dev`가 같은 `.next/dev` 디렉토리에 동시 쓰기를 시도하며 매니페스트 desync 발생.

### 2.3 증거 체인 검증 명령

```bash
# 활성 dev 프로세스 PGID 단위 카운트
ps -u "$USER" -o pid,ppid,pgid,etime,cmd --no-headers \
  | grep -E "turbo run dev|next dev|nest start --watch" \
  | grep -v grep \
  | awk '{print $3}' | sort -u | wc -l
# 정상=각 종류 1개씩 → 3 이하. 5+면 좀비 의심.

# 매니페스트 desync 비율
node -e '
  const fs=require("fs"),p=require("path");
  const root="apps/frontend/.next/dev/server";
  const reg=Object.keys(JSON.parse(fs.readFileSync(p.join(root,"app-paths-manifest.json"),"utf8"))).length;
  let comp=-1;(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const f=p.join(d,e.name);if(e.isDirectory())w(f);else if(e.name==="app-paths-manifest.json")comp++;
  }})(p.join(root,"app"));
  console.log({registered:reg,compiled:comp,ratio:(reg/comp).toFixed(2)});
'
# 정상 ratio≈1.0. 0.5 미만이면 desync 확정.
```

---

## 3. 복구 절차 (Recovery)

### 3.1 자동 (권장)

```bash
pnpm dev:fresh
```

수행 내역(요약):

1. `dev-doctor`로 좀비 PGID + 매니페스트 desync 진단
2. 사용자 confirm 후 좀비 PGID 단위 `kill -- -<PGID>` (SIGTERM, grace 5s, 잔존자 SIGKILL)
3. `apps/frontend/.next/dev` 디렉토리 제거 (`.next/cache`는 보존 — 재빌드 가속)
4. `pnpm dev` 재기동

옵션:

- `--dry-run`: 액션 없이 대상 출력만
- `--force` / `-y`: 확인 프롬프트 우회 (CI/스크립트용)
- `--no-restart`: 정리만, 재기동은 사용자에게 위임

실행 환경별 동작 차이:

- **TTY 대화형**(개발자 터미널): 재기동 시 `pnpm dev`를 foreground attach — Ctrl+C로 직접 제어 가능. dev-fresh가 종료되어도 dev 서버는 부모 셸 아래 유지.
- **non-TTY**(CI / 파이프 / nohup): 재기동 시 `pnpm dev`를 detached + `proc.unref()` 처리해서 부모 셸이 닫혀도 dev 서버는 살아남음. `--force`가 자동 적용되어 confirm 프롬프트 생략.

### 3.2 진단만

```bash
pnpm dev:doctor
```

종료 코드: `0`=정상, `1`=경고(좀비 등), `2`=치명(매니페스트 desync).
`--json` 플래그로 머신 가독 출력 (SessionStart hook이 사용).

### 3.3 수동 (스크립트 동작 이해용)

```bash
# 1. 좀비 PGID 식별 후 종료
ps -u "$USER" -o pid,pgid,cmd --no-headers \
  | grep -E "turbo run dev|next dev|nest start --watch" \
  | grep -v grep
# 좀비 PGID 결정 (가장 오래된 etime) → kill -TERM -- -<PGID>; sleep 5; kill -KILL -- -<PGID>

# 2. dev 캐시 클린
rm -rf apps/frontend/.next/dev

# 3. 재기동
pnpm dev
```

---

## 4. 예방 (Prevention)

### 4.1 SessionStart hook 자동 감지

`.claude/settings.json`의 SessionStart hook이 매 세션 시작 시 `dev-doctor --json`을 호출합니다. 좀비 또는 매니페스트 desync 발견 시 1줄 경고:

```
[dev-hygiene] zombies=4(pgids=2) manifest=desync — pnpm dev:doctor / pnpm dev:fresh
```

자동 종료/정리는 하지 않습니다 — 사용자가 다른 작업 중일 수 있어 파괴적 액션은 금지. 알림만.

### 4.2 워크플로 권장

| 상황                                         | 권장 동작                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| PC 부팅 직후, 첫 `pnpm dev`                  | 정상 흐름                                                                                                                            |
| 다른 세션이 dev 중일 때 신규 `pnpm dev` 시작 | 중단 권장 — 기존 세션에서 작업. Next가 `Another next dev server is already running`을 출력하면 `pnpm dev:doctor`로 lock PID/URL 확인 |
| 세션 시작 시 `[dev-hygiene]` 경고 출력       | `pnpm dev:fresh` 1회 실행                                                                                                            |
| 갑자기 `/login` 404 / ClientFetchError       | `pnpm dev:fresh`                                                                                                                     |
| 정상 종료 시 (`Ctrl+C`)                      | 별도 정리 불필요                                                                                                                     |
| `kill -9` 또는 터미널 강제 종료 직후         | 다음 dev 시작 전에 `pnpm dev:doctor` 권장                                                                                            |

### 4.3 SSOT

| 항목                                                                 | 정의 위치                                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 좀비 감지 패턴 (`turbo run dev` / `next dev` / `nest start --watch`) | `scripts/dev-doctor.mjs` `DEV_PROCESS_SIGNATURES`                                                                                               |
| Next.js dev lock 경로                                                | `scripts/dev-doctor.mjs` `NEXT_DEV_LOCK_PATH`                                                                                                   |
| 매니페스트 경로                                                      | `scripts/dev-doctor.mjs` `NEXT_DEV_MANIFEST_PATH`                                                                                               |
| Desync 임계값                                                        | `scripts/dev-doctor.mjs` `MANIFEST_SYNC_THRESHOLD` (기본 0.5)                                                                                   |
| Cold-start 가드 (false positive 방지)                                | `scripts/dev-doctor.mjs` `MANIFEST_MIN_COMPILED_FOR_DESYNC` (기본 8) — 컴파일된 라우트가 이 값 미만이면 `cold-start`로 분류해 desync 경고 안 함 |
| Doctor 호출 (스크립트 + hook)                                        | `pnpm dev:doctor` / `node scripts/dev-doctor.mjs --json`                                                                                        |

---

## 5. 비범위 (Out of Scope)

- 프로덕션 빌드(`next build`) 매니페스트 — `.next/build/` 사용, dev와 분리.
- Docker compose 서비스(DB/Redis) — dev 좀비 아님, `pnpm dev:fresh`가 건드리지 않음.
- Backend 단독 watch (`pnpm --filter backend run dev`) — turbo 없이 직접 실행 시 좀비 가능성 있으나 동일 명령 패턴 매칭으로 dev-doctor가 감지.

---

## 6. 다른 복구 스크립트와의 경계

이 시스템과 혼동하기 쉬운 다른 복구 명령들 — 진짜 원인에 맞는 도구 선택:

| 증상                                                  | 도구                                                             | 이유                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/login` 404, `/api/auth/*` 404, ClientFetchError     | **`pnpm dev:fresh`**                                             | Next.js dev 서버 매니페스트 desync — 본 문서 대상                                             |
| DB 연결 실패, `relation "..." does not exist`         | **`pnpm --filter backend run db:reset`**                         | Drizzle 마이그레이션 / 시드 데이터 꼬임 — DB 컨테이너 재구축 (CLAUDE.md L43)                  |
| Redis "Can't handle RDB format version" / Docker 꼬임 | **`pnpm predev:reset`**                                          | infra 컨테이너 매직바이트/스냅샷 불일치 — `infra/scripts/predev-guard.sh --confirm` 자동 수복 |
| 멀티 PC 이동 후 전체 재기동                           | **`git pull && pnpm --filter backend run db:reset && pnpm dev`** | DB는 ephemeral (CLAUDE.md L155). dev 서버 좀비 따로 발견되면 추가로 `pnpm dev:fresh`          |

`dev:fresh`는 dev 서버 프로세스/캐시 레이어만, `db:reset`은 DB 레이어, `predev:reset`은 컨테이너 레이어 — 책임 분리되어 있어 동시 사용 가능.

---

## 참고

- Next.js 16 cacheComponents (PPR 후속): https://nextjs.org/docs (라우트 매니페스트 lazy-compile 동작)
- POSIX process group (PGID): `man 2 setpgid`. `kill -- -<PGID>`는 그룹 전체 시그널.
- 본 SSOT는 `scripts/dev-doctor.mjs` + `scripts/dev-fresh.mjs`의 동작과 동기화. 코드 변경 시 본 문서도 함께 갱신.
