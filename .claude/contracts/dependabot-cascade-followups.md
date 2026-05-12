# Contract: dependabot-cascade-followups

**Sprint**: 2026-05-13
**Mode**: Mode 1 (Lightweight)
**Slug**: `dependabot-cascade-followups`

## Scope

3개 독립 태스크:
- **T-1** Node LTS 20→22 toolchain 마이그레이션
- **T-2** admin layout.tsx defense-in-depth 신설 + SKILL 룰 추가
- **T-3** ultrareview-preflight `.env.test` 패턴 수정

## MUST Criteria

### M-1: Node 버전 일관성
```bash
# package.json engines.node ≥22
grep '"node": ">=22' package.json
# backend Dockerfile node:22
grep "FROM node:22" apps/backend/docker/Dockerfile | wc -l | grep -E "^[3-9]|^[0-9]{2}"
# frontend Dockerfile node:22
grep "FROM node:22" apps/frontend/Dockerfile
# GitHub Actions workflows — NODE_VERSION: '22' (copilot-setup-steps는 lts/*, 변경 불필요)
for f in main accessibility-audit bundle-size performance-audit supply-chain-gate e2e-nightly codeql; do
  grep "NODE_VERSION: '22'" .github/workflows/$f.yml || echo "FAIL: $f"
done
```

### M-2: @types/node 버전 ≥22
```bash
grep '"@types/node": "\^22' package.json
grep '"@types/node": "\^22' apps/backend/package.json
grep '"@types/node": "\^22' apps/frontend/package.json
```

### M-3: admin layout.tsx 존재 + 세션 가드 포함
```bash
ls apps/frontend/app/\(dashboard\)/admin/layout.tsx
grep "getServerAuthSession\|redirect" apps/frontend/app/\(dashboard\)/admin/layout.tsx
grep "APPROVAL_ROLES\|hasPermission\|Permission" apps/frontend/app/\(dashboard\)/admin/layout.tsx
```

### M-4: admin layout가 SSOT import 준수
```bash
# 로컬 역할 리터럴 재정의 금지
grep "APPROVAL_ROLES\|ADMIN_ROLES" apps/frontend/app/\(dashboard\)/admin/layout.tsx | grep "import" | grep "@equipment-management"
# any 타입 금지
grep -v "//\|/\*" apps/frontend/app/\(dashboard\)/admin/layout.tsx | grep ": any" || echo "OK"
```

### M-5: ultrareview-preflight .env.test 수정
```bash
# 루트 .env.test 단독 패턴 제거 (tracked 파일 오검출 방지)
grep "pattern: '.env.test'" scripts/ultrareview-preflight.mjs | grep -v "backend\|frontend" || echo "PASS (삭제됨)"
# apps/backend/.env.test + apps/frontend/.env.test 는 명시적으로 존재해야 함
grep "apps/backend/.env.test\|apps/frontend/.env.test" scripts/ultrareview-preflight.mjs | wc -l | grep -E "^[2-9]"
```

### M-6: tsc 통과
```bash
pnpm tsc --noEmit 2>&1 | grep -E "error TS" | head -10 || echo "OK"
```

### M-7: verify-implementation SKILL.md admin 가드 룰 추가
```bash
grep "admin.*page\|page.tsx.*가드\|admin.*guard" .claude/skills/verify-implementation/SKILL.md -i | head -3
```

## SHOULD Criteria

### S-1: backend/frontend test 통과
```bash
pnpm --filter backend run test 2>&1 | tail -5
pnpm --filter frontend run test 2>&1 | tail -5
```

### S-2: pnpm install 정합성 (lockfile 업데이트 여부 확인)
```bash
pnpm install --frozen-lockfile 2>&1 | tail -5
```

## Out of Scope
- `copilot-setup-steps.yml` — 이미 `lts/*` 사용, 변경 불필요
- 실제 pnpm update @types/node@22 실행 (lockfile 갱신은 별도 결정)
- admin 페이지별 specific permission guard 수정 (page-level 유지가 defense-in-depth 목적)
