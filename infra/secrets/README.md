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
