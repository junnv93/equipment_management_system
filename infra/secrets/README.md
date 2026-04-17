# infra/secrets — sops+age 암호화 Secret

이 디렉토리는 **git 에 커밋되는 암호화된 환경 변수 파일** 을 보관합니다 (ADR-0005).

## 파일

| 파일                 | 용도                          | 대상 compose                      |
| -------------------- | ----------------------------- | --------------------------------- |
| `lan.env.sops.yaml`  | 사내 LAN VM 배포용 secret     | `infra/compose/lan.override.yml`  |
| `prod.env.sops.yaml` | 퍼블릭 프로덕션 배포용 secret | `infra/compose/prod.override.yml` |

**dev 환경 (`.env`) 는 이 디렉토리에 포함되지 않습니다.** 로컬 개발은 기존 `.env` (평문, `.gitignore` 로 제외) 를 계속 사용합니다.

## 사용법

### 최초 설정 (새 PC)

1. `docs/operations/secret-backup.md` 따라 age 키 생성 + 백업
2. `.sops.yaml` 의 `keys:` 섹션에 public key 추가 + 커밋
3. 기존 메인테이너가 `sops updatekeys infra/secrets/lan.env.sops.yaml` 로 기존 파일도 새 키로 재암호화

### 암호화된 파일 편집

```bash
pnpm secrets:edit ENV=lan      # → $EDITOR 로 열림, 저장 시 자동 재암호화
pnpm secrets:edit ENV=prod
```

### 복호화 (compose up 직전)

```bash
pnpm secrets:decrypt lan       # → /run/secrets/lan.env (tmpfs, 재부팅 시 소실)
pnpm secrets:decrypt prod
```

그 다음 compose 는 `env_file: /run/secrets/lan.env` 로 참조합니다. 자동화된 경로는 `pnpm compose:lan` / `pnpm compose:prod`.

### Secret 회전

- 값만 회전: `pnpm secrets:edit ENV=lan` 으로 해당 값만 수정 후 커밋
- age 키 회전 (분실/유출): `pnpm secrets:rotate-key` (상세: `docs/operations/secret-rotation.md`)

## 보안 규칙

- `*.sops.yaml` 은 암호화된 상태로만 커밋 (`.husky/pre-commit` 에서 검증)
- 복호화된 `/run/secrets/*.env` 는 **절대 커밋하지 않음** (`.gitignore` 에 `/run/secrets/` 추가됨)
- age 개인 키 (`~/.config/sops/age/keys.txt`) 는 **절대 저장소 바깥으로도 평문 공유하지 않음** — 백업은 1Password + 외장 USB 이중화 (runbook 참조)

## ENV SSOT 동기화 체크리스트

`apps/backend/src/config/env.validation.ts` 의 `envSchema` 가 **런타임 검증 SSOT** 입니다. required 환경변수를 추가/변경/삭제할 때는 다음 4개 계층을 전부 동기화해야 합니다 — 하나라도 누락되면 새 PC, LAN 배포, 프로덕션 부팅 중 하나가 `envSchema.safeParse` 실패로 차단됩니다.

| #   | 파일                                        | 대상                    | 동기화 명령                                          |
| --- | ------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| 1   | `apps/backend/src/config/env.validation.ts` | SSOT (zod schema)       | 코드 수정 (이 파일이 기준)                           |
| 2   | `.env.example`                              | 로컬 스캐폴드/온보딩    | 직접 편집, 키 + 플레이스홀더 + 주석 (생성 명령 포함) |
| 3   | `apps/backend/.env`                         | 개발자 로컬 (gitignore) | 실제 dev 값 설정 (`openssl rand -hex 32` 등)         |
| 4   | `infra/secrets/{lan,prod}.env.sops.yaml`    | LAN/프로덕션 배포       | `pnpm secrets:edit ENV=lan` / `ENV=prod`             |

`.husky/pre-push` 의 `pnpm verify:env-sync` 가 **1과 2의 drift 를 자동 검증**합니다. sops 파일(4)은 age 키 소유자만 열 수 있으므로 수동 동기화 — 새 required 키를 추가한 PR 을 merge 하기 전에 **반드시** `pnpm secrets:edit` 로 양쪽 sops 파일에 반영하세요.

### 예시: 새 required 시크릿 추가 플로우

```bash
# 1) envSchema 에 추가
#    (apps/backend/src/config/env.validation.ts)
#      FOO_SECRET: z.string().min(32, 'FOO_SECRET must be at least 32 characters'),

# 2) .env.example 에 문서화된 placeholder 추가
#    FOO_SECRET=your_foo_secret_minimum_32_chars   # openssl rand -hex 32

# 3) 로컬 .env 에 실제 값
echo "FOO_SECRET=$(openssl rand -hex 32)" >> apps/backend/.env

# 4) LAN / 프로덕션 sops 에도 반영
pnpm secrets:edit ENV=lan   # $EDITOR 에서 FOO_SECRET 추가 → 저장 시 자동 재암호화
pnpm secrets:edit ENV=prod

# 5) drift 게이트 확인
pnpm verify:env-sync   # pre-push 에서도 자동 실행됨
```
