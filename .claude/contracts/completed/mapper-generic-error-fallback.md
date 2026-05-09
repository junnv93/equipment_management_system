# 스프린트 계약: mapper-generic-error-fallback

## 생성 시점
2026-05-09

## Slug
mapper-generic-error-fallback

## 모드
Mode 1 — 4 매퍼 fallback 경로에서 raw error.message → t('errors.genericError') 통일

## 변경 범위
- `apps/frontend/lib/errors/disposal-errors.ts` — fallback description 1줄
- `apps/frontend/lib/errors/notification-errors.ts` — fallback description 1줄
- `apps/frontend/lib/errors/team-errors.ts` — fallback description 1줄
- `apps/frontend/lib/errors/user-errors.ts` — fallback description 1줄

**기존 코드 수정**: fallback return 블록 description만. 함수 시그니처/에러 매핑/Zod 분기/sentinel 상수 변경 금지.

---

## 성공 기준

### MUST

- [ ] **M-1** `pnpm tsc --noEmit` 에러 0
  ```bash
  pnpm tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"
  ```

- [ ] **M-2** `pnpm --filter frontend run lint` exit 0

- [ ] **M-3** 4 매퍼 fallback에서 `error.message` / `String(error)` 미사용
  ```bash
  grep -n "error\.message\|String(error)" \
    apps/frontend/lib/errors/disposal-errors.ts \
    apps/frontend/lib/errors/notification-errors.ts \
    apps/frontend/lib/errors/team-errors.ts \
    apps/frontend/lib/errors/user-errors.ts
  # 기대: 빈 출력 (0건)
  ```

- [ ] **M-4** 4 매퍼 fallback이 `t('errors.genericError')` 사용
  ```bash
  grep -c "errors\.genericError" \
    apps/frontend/lib/errors/disposal-errors.ts \
    apps/frontend/lib/errors/notification-errors.ts \
    apps/frontend/lib/errors/team-errors.ts \
    apps/frontend/lib/errors/user-errors.ts
  # 기대: 각 파일 ≥ 1
  ```

- [ ] **M-5** `USER_ERROR_FALLBACK_I18N_KEY` sentinel 보존 (user-errors.ts guard 로직 유지)
  ```bash
  grep -c "USER_ERROR_FALLBACK_I18N_KEY" apps/frontend/lib/errors/user-errors.ts
  # 기대: ≥ 2 (상수 정의 + guard 비교)
  ```

- [ ] **M-6** 함수 시그니처 변경 0건 (t, tErrors 파라미터 보존)
  ```bash
  grep -E "export function map(Disposal|Notification|Team|User)ErrorToToast" \
    apps/frontend/lib/errors/disposal-errors.ts \
    apps/frontend/lib/errors/notification-errors.ts \
    apps/frontend/lib/errors/team-errors.ts \
    apps/frontend/lib/errors/user-errors.ts | wc -l
  # 기대: 4
  ```

- [ ] **M-7** Zod 분기 보존 (mapZodIssuesToToast 호출 유지)
  ```bash
  grep -c "mapZodIssuesToToast" \
    apps/frontend/lib/errors/disposal-errors.ts \
    apps/frontend/lib/errors/notification-errors.ts \
    apps/frontend/lib/errors/team-errors.ts \
    apps/frontend/lib/errors/user-errors.ts
  # 기대: 각 파일 ≥ 1
  ```

- [ ] **M-8** `errors.genericError` 키 8 파일 존재 (이전 sprint 보존 확인)
  ```bash
  node -e "
  const fs=require('fs');
  const ok=fs.readFileSync('apps/frontend/messages/ko/disposal.json','utf8');
  const j=JSON.parse(ok);
  console.log(j.errors?.genericError ? 'PASS' : 'FAIL');
  "
  ```

### SHOULD

- [ ] **S-1** `errors.title` 호출 유지 (fallback return title)
  ```bash
  grep -c "t('errors.title')" \
    apps/frontend/lib/errors/disposal-errors.ts \
    apps/frontend/lib/errors/notification-errors.ts \
    apps/frontend/lib/errors/team-errors.ts \
    apps/frontend/lib/errors/user-errors.ts
  # 기대: 각 파일 ≥ 1
  ```
