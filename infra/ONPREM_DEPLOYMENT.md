# 온프레미스 서버 배포 가이드

이 문서는 회사 보안정책에 따라 **관리되는 온프레미스 서버**에 장비관리시스템을 배포하는 절차입니다.
개발자 PC 또는 임의 사내 LAN PC를 운영 서버로 쓰는 방식은 더 이상 표준 배포 경로가 아닙니다.

## 배포 모델

- 대상: 회사가 승인한 온프레미스 Linux 서버 또는 VM
- 진입점: nginx 단일 origin
- 기본 포트: `9000`
- 내부 서비스: frontend, backend, postgres, redis, rustfs는 Docker 내부 네트워크에서만 통신
- 공개 URL: `ONPREM_PUBLIC_ORIGIN` 하나로 통일

예시:

```bash
ONPREM_PUBLIC_ORIGIN=http://equipment.company.local:9000
```

TLS 또는 회사 표준 reverse proxy가 앞단에 있으면 다음처럼 설정합니다.

```bash
ONPREM_PUBLIC_ORIGIN=https://equipment.company.local
```

## 최초 준비

```bash
cd /opt/equipment_management_system

sudo mkdir -p /var/lib/equipment-system/{postgres,redis,rustfs,backups,logs/backend}
sudo chown -R "$USER:$USER" /var/lib/equipment-system
```

온프레미스 secret 파일을 생성하거나 편집합니다.

```bash
pnpm secrets:edit ENV=onprem
```

필수 값:

```bash
ONPREM_PUBLIC_ORIGIN=http://equipment.company.local:9000
DB_PASSWORD=...
REDIS_PASSWORD=...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
HANDOVER_TOKEN_SECRET=...
NEXTAUTH_SECRET=...
INTERNAL_API_KEY=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
```

## 배포

```bash
pnpm compose:onprem
pnpm compose:onprem:migrate
```

직접 실행이 필요하면:

```bash
pnpm secrets:decrypt onprem
docker compose --env-file=/run/secrets/onprem.env \
  -f infra/compose/base.yml \
  -f infra/compose/onprem.override.yml \
  up -d --build --wait
```

## 검증

배포 직후 자동 스모크(권장):

```bash
pnpm compose:onprem:verify
```

이 명령은 ADR-0006 invariant(NextAuth handler 분기, Set-Cookie SameSite/HttpOnly/Secure,
backend disjoint sanity)를 한 번에 검증합니다. 종료 코드 0=PASS, 1=FAIL, 2=ENV 누락.
JSON 출력은 `pnpm compose:onprem:verify -- --json`. 상세: `scripts/onprem-verify.mjs` 헤더 주석.

수동 fallback (네트워크/도구 제약 시):

```bash
curl -i "$ONPREM_PUBLIC_ORIGIN/api/auth/csrf"
curl -i "$ONPREM_PUBLIC_ORIGIN/api/health"
```

`/api/auth/csrf`는 200 JSON을 반환해야 합니다. 이 경로는 backend가 아니라 frontend의 NextAuth
handler가 응답해야 합니다.

정적 SSOT 회귀 검증 (배포 전 게이트):

```bash
bash scripts/verify-routing-origin.sh
```

회귀가 의심되면 1차 진단 harness(`scripts/diagnostics/nextauth-csrf-trace.mjs`)를 실행해
환경변수 stack/SW/proxy 헤더/cookie domain 종합 진단을 수행합니다. 절차:
[scripts/diagnostics/README.md](../scripts/diagnostics/README.md).

## 네트워크 요청 사항

회사 인프라/보안팀에 요청할 항목:

- 온프레미스 서버 고정 IP 또는 내부 DNS
- 사용자 PC에서 서버 `9000/tcp` 또는 회사 표준 reverse proxy 포트 접근 허용
- Azure AD 연동에 필요한 outbound HTTPS 허용
- 서버 백업 정책: `/var/lib/equipment-system/postgres`, `/redis`, `/rustfs`, `/backups`

## Legacy LAN 문서

`DEPLOYMENT_LAN.md`와 `QUICKSTART_LAN.md`는 과거 “사내 LAN PC 배포” 기준 문서입니다.
신규 운영 배포에는 이 문서를 사용하세요.
