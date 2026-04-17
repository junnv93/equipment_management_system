# Secret 회전 Runbook

본 문서는 [ADR-0005](../adr/0005-secret-management-roadmap.md) 의 "회전은 수동 + git commit 감사" 원칙을 이행한다. 자동 회전(Vault dynamic credential) 은 트리거 조건 충족 시 ADR-0006 으로 별도 설계한다.

## 회전 대상과 주기

| Secret                            | 권장 주기                | 회전 난이도                                   | 회전 시 사이드 이펙트              |
| --------------------------------- | ------------------------ | --------------------------------------------- | ---------------------------------- |
| `DB_PASSWORD`                     | 180일 또는 유출 의심 시  | 중 (Postgres ALTER USER + compose env 동기화) | 애플리케이션 재시작 필요           |
| `REDIS_PASSWORD`                  | 180일                    | 중                                            | Redis 재시작, 세션 캐시 소실       |
| `JWT_SECRET`                      | 180일 또는 유출 의심 시  | 고                                            | **모든 사용자 재로그인 필수**      |
| `REFRESH_TOKEN_SECRET`            | 180일                    | 고                                            | **모든 refresh token 무효화**      |
| `HANDOVER_TOKEN_SECRET`           | 180일 또는 유출 의심 시  | 저 (TTL 10분이라 롤링 자연 소멸)              | 진행 중 handover 토큰만 무효화     |
| `INTERNAL_API_KEY`                | 90일                     | 저 (`INTERNAL_API_KEY_PREVIOUS` 로 롤링)      | 서비스 간 다운타임 없음            |
| `AZURE_AD_CLIENT_SECRET`          | Azure 정책 (보통 24개월) | 저                                            | 재로그인 필요 없음 (서버 재시작만) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | 180일                    | 중                                            | RustFS 재시작 필요                 |
| `NEXTAUTH_SECRET`                 | 180일                    | 고                                            | 모든 NextAuth 세션 무효화          |
| `GRAFANA_ADMIN_PASSWORD`          | 90일                     | 저                                            | Grafana 관리자 재로그인            |
| `SMTP_PASSWORD`                   | SMTP 공급자 정책         | 저                                            | 이메일 알림 일시 중단              |

## 값 회전 절차 (공통)

```bash
# 1. 신규 값 생성 (예: JWT_SECRET)
openssl rand -base64 32

# 2. sops 로 편집 (값만 교체)
pnpm secrets:edit ENV=lan
# 편집기에서 JWT_SECRET: <new_value> 저장

# 3. 커밋 (암호화된 상태로 커밋됨 — git diff 는 ENC[] 변경만 보임)
git add infra/secrets/lan.env.sops.yaml
git commit -m "chore(secrets): rotate JWT_SECRET for lan (scheduled)"

# 4. LAN 서버에 배포
ssh lan-server
cd /opt/equipment_management_system
git pull
pnpm secrets:decrypt lan
docker compose -f infra/compose/base.yml -f infra/compose/lan.override.yml up -d --force-recreate backend frontend
```

## Handover 토큰 Secret 회전 (저위험)

`HANDOVER_TOKEN_SECRET`은 1회성 + TTL 10분 토큰 서명 키. 회전 시 유일한 영향은 **현재 사용 중인 발급 토큰 무효화**뿐이며, 최대 10분 후 자연 소멸.

```bash
pnpm secrets:edit ENV=lan                 # HANDOVER_TOKEN_SECRET 교체
git commit -am "chore(secrets): rotate HANDOVER_TOKEN_SECRET for lan"
pnpm compose:lan                           # backend 재시작 — 진행 중 handover 토큰만 실패
```

재발급 안내: 인수인계 진행 중 사용자는 `/handover?token=...` 접근 시 `Invalid token` → 대여자에게 QR 재발급 요청.

## 0-다운타임 회전 (`INTERNAL_API_KEY` 만 가능)

서비스 간 API 키는 `INTERNAL_API_KEY_PREVIOUS` 로 2단계 롤링 가능.

```
Step 1: 신규 키 도입
  INTERNAL_API_KEY=<NEW>
  INTERNAL_API_KEY_PREVIOUS=<OLD>   # backend 가 둘 다 수락
  → 배포

Step 2: 클라이언트(frontend) 전환
  → NEW 만 사용하도록 배포

Step 3: 이전 키 제거
  INTERNAL_API_KEY=<NEW>
  INTERNAL_API_KEY_PREVIOUS=         # 빈 값
  → 배포
```

## JWT / NextAuth 회전 시 사용자 공지

`JWT_SECRET` 또는 `NEXTAUTH_SECRET` 회전 = 모든 세션 무효화. 사용자 재로그인 요구.

**배포 타이밍**:

- 업무시간 외 (평일 야간 / 주말)
- 사내 공지 채널에 선 공지 (T-24h, T-1h)
- 배포 직후 관리자가 로그인 성공 여부 모니터링

## 유출 의심 시 긴급 회전

1. **Slack 등 외부 유출 경로 봉쇄** (해당 채널 메시지 삭제)
2. 영향 secret 즉시 회전 (위 절차, 공지 생략)
3. `AuditLog` + access log 검토 — 해당 키로 이루어진 이상 요청 탐지
4. 필요시 `AuditLog.action='LOGIN'` 강제 invalidate (DB 레벨 세션 만료)
5. [post-mortem](../references/) 작성

## age 키 회전 (키 자체 교체)

[secret-backup.md §시나리오 1](secret-backup.md) 참조. 핵심 차이점: **값 회전 + 키 회전 2가지 모두 수행해야 함**.

## 자동화 범위

현 단계에서 자동화하는 것:

- ✅ sops 재암호화 (`pnpm secrets:rotate-key`)
- ✅ compose 재시작 래퍼 (`pnpm compose:lan`)

자동화하지 않는 것 (수동 + 리뷰):

- ❌ 값 생성 (`openssl rand`)
- ❌ 회전 주기 알림 — 90/180일 캘린더 리마인더로 대체
- ❌ DB/Redis 실제 비밀번호 변경 명령 (실수 파급 큼)

Vault 도입(ADR-0006) 시 위 "자동화하지 않는 것" 도 전환 대상이 된다.
