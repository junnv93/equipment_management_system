# Evaluation Report: NextAuth CSRF On-prem/Prod Routing Verification

## 반복 #1 (2026-05-04T00:00:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `bash scripts/verify-routing-origin.sh` | PASS | ADR-0006 4-layer SSOT 전체 PASS |
| shared-constants api-routing test | PASS | 34개 테스트 PASS |
| nginx NextAuth 분기 | PASS | `infra/nginx/lan.conf` + `nginx.conf.template` 모두 NextAuth handler를 frontend로 분기 |
| onprem compose config | PASS | `ONPREM_PUBLIC_ORIGIN` 주입 기준 compose config 파싱 성공 |
| onprem 운영 이미지 build | PASS | frontend/backend production image build 성공 |

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| 운영 명령 정합 | PASS | `pnpm compose:onprem`, `pnpm compose:onprem:migrate` 추가 |
| legacy LAN 혼동 제거 | PASS | 기존 LAN 문서 deprecated 배너 추가, `ONPREM_DEPLOYMENT.md` 신규 작성 |

## 전체 판정: PASS

## 비고

- 실제 온프레미스 서버에서의 `curl "$ONPREM_PUBLIC_ORIGIN/api/auth/csrf"` 검증은 서버/DNS/포트가 배정된 뒤 수행한다.
- 현재 머신의 Docker config는 `/home/kmjkds/.docker/config.json` 파싱 경고가 있으나 build 자체는 통과했다.
