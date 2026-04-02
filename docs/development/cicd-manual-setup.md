# CI/CD 수동 설정 가이드

CI/CD 파이프라인에서 자동화할 수 없는 GitHub UI 설정 항목입니다.

## 1. Production Environment Required Reviewers (P3-D)

프로덕션 배포 전 수동 승인 게이트를 활성화합니다.

1. GitHub → Settings → Environments → `production`
2. "Required reviewers" 활성화
3. 승인 권한자 추가 (팀 리드 또는 DevOps 담당자)
4. "Wait timer" 설정 (선택, 권장: 0분)

> Staging environment에도 동일하게 설정 가능하나, 일반적으로 production만 설정합니다.

## 2. CodeQL Branch Protection (P3-C)

CodeQL 분석 결과를 PR 머지 차단 조건으로 추가합니다.

1. GitHub → Settings → Branches → Branch protection rules → `main`
2. "Require status checks to pass before merging" 활성화
3. 필수 검사 추가:
   - `CodeQL / Analyze (javascript-typescript)`
4. "Require branches to be up to date before merging" 활성화

## 3. 시크릿 설정

`.env.ci.example` 파일을 참조하여 GitHub → Settings → Secrets and variables → Actions에
필요한 시크릿을 등록합니다.

### 필수 시크릿

| Secret                    | 용도               | 설정 필요 시점 |
| ------------------------- | ------------------ | -------------- |
| `JWT_SECRET`              | 백엔드 JWT 서명    | 테스트 실행 시 |
| `REFRESH_TOKEN_SECRET`    | 리프레시 토큰 서명 | 테스트 실행 시 |
| `DOCKER_HUB_USERNAME`     | Docker Hub 계정    | 배포 시        |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub PAT     | 배포 시        |
| `DEPLOY_HOST`             | 프로덕션 서버 IP   | 배포 시        |
| `DEPLOY_USER`             | SSH 사용자명       | 배포 시        |
| `DEPLOY_SSH_KEY`          | SSH 개인 키        | 배포 시        |

### 선택 시크릿

| Secret                | 용도                                         |
| --------------------- | -------------------------------------------- |
| `STAGING_DEPLOY_HOST` | 스테이징 서버 IP (없으면 스테이징 배포 스킵) |
| `SLACK_WEBHOOK`       | 배포 알림 Slack 웹훅                         |
| `GRAFANA_URL`         | Grafana 배포 마커 API URL                    |
| `GRAFANA_API_KEY`     | Grafana 서비스 계정 토큰                     |
| `NEXTAUTH_SECRET`     | NextAuth 세션 암호화                         |
