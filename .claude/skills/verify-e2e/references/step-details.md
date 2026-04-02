# E2E 테스트 패턴 검증 — Step 상세

## Step 1: Auth Fixture 사용

```bash
# loginAs 패턴 사용 탐지
grep -rn "loginAs\|signIn\|login(" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth-role-access\|// "

# /login 직접 접근 탐지
grep -rn "goto.*['\"].*\/login" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth.spec.ts\|auth-token-sync\|auth-role-access\|// "
```

## Step 2: Import 소스

```bash
grep -rn "from '@playwright/test'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth.spec.ts\|auth-token-sync\|auth-role-access\|security.spec\|overdue-auto-nc\|seed-\|equipment-seed\|checkout-seed\|manual-test-seed\|accessibility.spec"
```

예외: auth 테스트, 보안 테스트, API 전용 테스트, seed 파일, 접근성 테스트.

## Step 3: networkidle 금지

```bash
grep -rn "networkidle" apps/frontend/tests/e2e --include="*.ts"
```

```typescript
// ❌ WRONG — HMR WebSocket이 idle 방해 → 2분 타임아웃
await page.waitForLoadState('networkidle');

// ✅ CORRECT — 구체적 요소 대기
await page.goto('/equipment');
await expect(page.getByRole('heading', { name: '장비 목록' })).toBeVisible();
```

## Step 4: waitForTimeout 금지

```bash
grep -rn "waitForTimeout" apps/frontend/tests/e2e --include="*.ts"
```

```typescript
// ❌ WRONG
await page.waitForTimeout(1000);

// ✅ CORRECT
await expect(page.getByRole('button', { name: '승인' })).toBeEnabled();
```

예외: 헬퍼 함수에서 애니메이션 대기용 짧은 `waitForTimeout(200~500)` 경고 수준.

## Step 5: Locator 안티패턴

```bash
# [role="..."] CSS selector
grep -rn 'locator.*\[role=' apps/frontend/tests/e2e --include="*.ts" | grep -v "// "

# waitForFunction
grep -rn "waitForFunction" apps/frontend/tests/e2e --include="*.ts" | grep -v "// "

# .or() 패턴
grep -rn "\.or(" apps/frontend/tests/e2e --include="*.ts" | grep -v "// \|emptyState\|empty"
```

## Step 6: UUID 하드코딩

```bash
grep -rn "'[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "// \|import "
```

## Step 7: 상태 변경 테스트 격리

```bash
# 상태 변경 spec 파일
grep -rln "approve\|reject\|create\|delete\|cancel" apps/frontend/tests/e2e --include="*.spec.ts" | head -20

# serial 모드 미설정 탐지
for f in $(grep -rln "approve\|reject\|\.click.*승인\|\.click.*반려" apps/frontend/tests/e2e --include="*.spec.ts" | head -20); do
  grep -L "mode.*serial" "$f" 2>/dev/null
done
```

## Step 8: Backend 캐시 클리어

```bash
grep -rn "pool.query.*UPDATE\|pool.query.*DELETE\|pool.query.*INSERT" apps/frontend/tests/e2e --include="*.ts" -l | xargs grep -L "clearBackendCache" 2>/dev/null
```

## Step 9: Backend 토큰 직접 호출

```bash
grep -rn "test-login" apps/frontend/tests/e2e --include="*.ts" | grep -v "api-helpers.ts\|// \|getBackendToken\|fetchBackendToken"
```

## Step 10: Backend URL 하드코딩

```bash
grep -rn "localhost:3001\|localhost:3000" apps/frontend/tests/e2e --include="*.ts" | grep -v "shared-test-data.ts\|constants/\|// \|process\.env"
```

## Step 11b: TEST_USERS_BY_TEAM import

```bash
grep -rn "import.*TEST_USERS_BY_TEAM.*@equipment-management/shared-constants" apps/frontend/tests/e2e/shared/constants/shared-test-data.ts
```

## Step 11: Pool 정리

```bash
grep -rln "new Pool" apps/frontend/tests/e2e --include="*.ts" | xargs grep -L "cleanupPool\|pool\.end\|closePool"
```

## Step 12: 아키텍처 시나리오 커버리지

### 12a: CAS VERSION_CONFLICT 테스트

```bash
FEATURES=$(grep -rln "approve\|reject\|receive\|cancel\|dispose" apps/frontend/tests/e2e/features --include="*.spec.ts" | sed 's|/[^/]*$||' | sort -u)

for dir in $FEATURES; do
  HAS_CONFLICT=$(grep -rln "409\|VERSION_CONFLICT\|conflict\|version.*mismatch" "$dir" --include="*.spec.ts" 2>/dev/null | wc -l)
  if [ "$HAS_CONFLICT" -eq 0 ]; then
    echo "WARN: $dir — VERSION_CONFLICT 시나리오 없음"
  fi
done
```

### 12b: 뮤테이션 후 캐시 일관성

```bash
grep -rn "click.*승인\|click.*반려\|click.*수령\|mutate" apps/frontend/tests/e2e/features --include="*.spec.ts" -l | while read f; do
  HAS_LIST_CHECK=$(grep -c "goto.*list\|goto.*checkouts\|goto.*equipment[^/]\|getByText.*건\|getByText.*총" "$f" 2>/dev/null)
  if [ "$HAS_LIST_CHECK" -eq 0 ]; then
    echo "INFO: $f — 목록 복귀 후 데이터 갱신 검증 없음"
  fi
done
```

### 12c: 사이트 접근 제어 범위

```bash
SITE_TESTS=$(find apps/frontend/tests/e2e -name "*.spec.ts" | xargs grep -l "site.*isolation\|cross.*site\|enforceSite\|403.*Forbidden\|다른.*사이트" 2>/dev/null)

if [ -z "$SITE_TESTS" ]; then
  echo "WARN: 사이트 접근 제어 테스트 없음"
else
  HAS_MUTATION=$(echo "$SITE_TESTS" | xargs grep -l "patch\|post\|delete\|approve\|reject" 2>/dev/null | wc -l)
  if [ "$HAS_MUTATION" -eq 0 ]; then
    echo "WARN: GET만 검증 — mutation 접근 제어 미검증"
  fi
fi
```
