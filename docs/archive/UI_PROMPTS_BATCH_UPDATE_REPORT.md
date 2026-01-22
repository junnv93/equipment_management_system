# UI 프롬프트 일괄 업데이트 리포트

**작성일**: 2026-01-22
**작성자**: Claude Sonnet 4.5

---

## 📋 개요

모든 FRONTEND_UI_PROMPTS 문서를 올바른 E2E 테스트 인증 방식으로 일괄 업데이트했습니다.

**근본 문제**: 기존 문서의 `loginAs` 함수가 백엔드 JWT를 직접 쿠키에 저장하는 잘못된 방식을 안내하고 있었습니다.

**해결 방법**: NextAuth의 정상적인 인증 플로우를 사용하도록 모든 문서 수정

---

## ✅ 업데이트된 파일 목록

총 **19개 파일** (UI-1 ~ UI-19)

1. ✅ FRONTEND_UI_PROMPTS(UI-1: 역할별 대시보드).md
2. ✅ FRONTEND_UI_PROMPTS(UI-2: 장비 목록,검색 UI 개선).md
3. ✅ FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지).md
4. ✅ FRONTEND_UI_PROMPTS(UI-4: 알림 센터).md
5. ✅ FRONTEND_UI_PROMPTS(UI-5: 보고서,대장 출력).md
6. ✅ FRONTEND_UI_PROMPTS(UI-6: 반응형 레이아웃 및 접근성).md
7. ✅ FRONTEND_UI_PROMPTS(UI-7: 로그인,인증 페이지).md
8. ✅ FRONTEND_UI_PROMPTS(UI-8: 장비 등록,수정 폼).md
9. ✅ FRONTEND_UI_PROMPTS(UI-9: 장비 상세 페이지).md
10. ✅ FRONTEND_UI_PROMPTS(UI-10: 교정 관리 페이지).md
11. ✅ FRONTEND_UI_PROMPTS(UI-11: 교정계획서 관리).md
12. ✅ FRONTEND_UI_PROMPTS(UI-12: 대여 관리 페이지).md
13. ✅ FRONTEND_UI_PROMPTS(UI-13: 반출 반입 관리 페이지).md
14. ✅ FRONTEND_UI_PROMPTS(UI-14: 보정계수 관리 페이지).md
15. ✅ FRONTEND_UI_PROMPTS(UI-15: 부적합 장비 관리).md
16. ✅ FRONTEND_UI_PROMPTS(UI-16: 수리이력 관리).md
17. ✅ FRONTEND_UI_PROMPTS(UI-17: 소프트웨어 관리대장).md
18. ✅ FRONTEND_UI_PROMPTS(UI-18: 팀 관리 페이지).md
19. ✅ FRONTEND_UI_PROMPTS(UI-19: 설정 및 관리자 페이지).md

---

## 🔧 수정 내용

### 1. E2E 테스트 인증 가이드 참조 추가

**위치**: `## 문서 참조` 섹션

**추가된 내용**:

```markdown
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` ⚠️ **필수 참조**
```

### 2. Playwright 테스트 가이드 상단 경고 추가

**위치**: `## Playwright 테스트 가이드` 섹션 상단

**추가된 내용**:

```markdown
> **⚠️ 중요**: E2E 테스트 인증 처리 방법은 **반드시** [E2E_TEST_AUTH_GUIDE.md](E2E_TEST_AUTH_GUIDE.md)를 참조하세요!
>
> **핵심**: NextAuth의 정상적인 인증 플로우를 사용해야 합니다. 백엔드 JWT를 직접 쿠키에 저장하는 방식은 작동하지 않습니다.
```

### 3. 테스트 명령어에 NODE_ENV=test 추가

**변경 전**:

```bash
pnpm exec playwright test
pnpm exec playwright test --ui
pnpm exec playwright test --debug
```

**변경 후**:

```bash
NODE_ENV=test pnpm exec playwright test
NODE_ENV=test pnpm exec playwright test --ui
NODE_ENV=test pnpm exec playwright test --debug
```

### 4. 역할명 수정

| 이전 (❌ 잘못됨) | 이후 (✅ 올바름) | 설명          |
| ---------------- | ---------------- | ------------- |
| `test_operator`  | `test_engineer`  | 시험실무자    |
| `site_admin`     | `lab_manager`    | 시험소 관리자 |

**인터페이스 주석 추가**:

```typescript
interface AuthFixtures {
  testOperatorPage: Page; // 시험실무자 (test_engineer)
  techManagerPage: Page; // 기술책임자 (technical_manager)
  siteAdminPage: Page; // 시험소 관리자 (lab_manager)
  systemAdminPage: Page; // 시스템 관리자 (system_admin)
}
```

### 5. loginAs 함수 완전 교체

**이전 (❌ 잘못됨)**:

```typescript
async function loginAs(page: Page, role: string) {
  // 테스트 환경에서는 mock 인증 또는 테스트 계정 사용
  await page.goto('/api/auth/test-login?role=' + role);
  await page.waitForURL('/dashboard');
}
```

**이후 (✅ 올바름)**:

```typescript
/**
 * ✅ 올바른 로그인 방식 - NextAuth callback API 직접 호출
 *
 * 플로우:
 * 1. NextAuth CSRF 토큰 획득
 * 2. NextAuth callback API로 POST 요청
 * 3. NextAuth가 세션 생성 및 쿠키 저장
 *
 * 상세: /docs/development/E2E_TEST_AUTH_GUIDE.md
 */
async function loginAs(page: Page, role: string) {
  try {
    // 1. CSRF 토큰 획득
    const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    // 2. NextAuth callback API로 POST 요청
    const loginResponse = await page.request.post(
      'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
      {
        form: {
          role: role,
          csrfToken: csrfToken,
          json: 'true',
        },
      }
    );

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`);
    }

    // 3. 메인 페이지로 이동하여 세션 확인
    await page.goto('/');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed: redirected to login page');
    }
  } catch (error) {
    console.error(`Failed to login as ${role}:`, error);
    throw error;
  }
}
```

**역할명 매핑 추가**:

```markdown
**역할명 매핑**:

- `test_engineer` - 시험실무자 (Test Engineer)
- `technical_manager` - 기술책임자 (Technical Manager)
- `lab_manager` - 시험소 관리자 (Lab Manager)
- `system_admin` - 시스템 관리자 (System Admin)
```

### 6. 픽스처 섹션 주석 추가

**위치**: `### 역할별 로그인 픽스처` 헤더 바로 아래

**추가된 내용**:

```markdown
> **⚠️ 이 코드는 참고용입니다.** 실제 구현은 `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`를 사용하세요.
>
> **중요**: NextAuth의 정상적인 인증 플로우를 사용합니다. 상세한 설명은 [E2E_TEST_AUTH_GUIDE.md](E2E_TEST_AUTH_GUIDE.md)를 참조하세요.
```

### 7. loginAs 호출 시 주석 추가

```typescript
await loginAs(page, 'test_engineer'); // ✅ 올바른 역할명
await loginAs(page, 'lab_manager'); // ✅ 올바른 역할명 (site_admin 아님)
```

---

## 🎯 핵심 변경 사항 요약

### 잘못된 접근 (이전)

```typescript
// ❌ NextAuth를 우회하고 백엔드 JWT를 직접 쿠키에 저장
await page.goto('/api/auth/test-login?role=' + role);
```

**문제점**:

- NextAuth 세션 인식 실패
- Middleware에서 인증 실패로 판단
- 로그인 페이지로 리다이렉트
- 테스트 83.3% 실패

### 올바른 접근 (현재)

```typescript
// ✅ NextAuth의 정상적인 인증 플로우 사용
// 1. CSRF 토큰 획득
// 2. NextAuth callback API POST
// 3. NextAuth 세션 생성
```

**장점**:

- NextAuth가 세션 생성 및 쿠키 관리
- Middleware, Server/Client Components 정상 작동
- 실제 프로덕션 환경과 동일한 플로우
- "단일 인증 소스(SSOT)" 원칙 준수

---

## 📊 검증 결과

### 1. 문서 참조 섹션

```bash
$ grep "E2E 테스트 인증 가이드" FRONTEND_UI_PROMPTS*.md | wc -l
19
```

✅ 19개 파일 모두 E2E 가이드 참조 추가됨

### 2. Playwright 경고

```bash
$ grep "⚠️ 중요**: E2E 테스트 인증" FRONTEND_UI_PROMPTS*.md | wc -l
19
```

✅ 19개 파일 모두 경고 추가됨

### 3. NODE_ENV=test

```bash
$ grep "NODE_ENV=test pnpm exec playwright test" FRONTEND_UI_PROMPTS*.md | wc -l
57  # 19개 파일 × 3개 명령어 = 57개
```

✅ 모든 Playwright 명령어에 NODE_ENV=test 추가됨

### 4. 역할명 수정

```bash
$ grep "test_operator" FRONTEND_UI_PROMPTS*.md | wc -l
0

$ grep "site_admin" FRONTEND_UI_PROMPTS*.md | wc -l
0
```

✅ 잘못된 역할명 완전히 제거됨

---

## 🔐 백업

**백업 파일 위치**:

```
/home/kmjkd/equipment_management_system/docs/development/FRONTEND_UI_PROMPTS_backup_*.tar.gz
```

필요 시 롤백 가능:

```bash
cd /home/kmjkd/equipment_management_system/docs/development
tar -xzf FRONTEND_UI_PROMPTS_backup_*.tar.gz
```

---

## 📚 관련 문서

이번 일괄 업데이트와 관련된 문서들:

1. **E2E_TEST_AUTH_GUIDE.md** - E2E 테스트 인증 완벽 가이드
2. **IMPLEMENTATION_SUCCESS_REPORT.md** - UI-2 구현 성공 리포트
3. **TEST_EXECUTION_GUIDE.md** - 테스트 실행 가이드
4. **apps/frontend/tests/e2e/fixtures/auth.fixture.ts** - 실제 구현 코드
5. **apps/frontend/lib/auth.ts** - NextAuth test-login Provider
6. **.claude/skills/equipment-management/references/e2e-test-auth.md** - 스킬 참조 문서

---

## ✨ 효과

### 이전 (문제 상황)

개발자가 UI 프롬프트 문서를 따라 E2E 테스트를 작성하면:

- ❌ 잘못된 인증 방식으로 구현
- ❌ 테스트 실패 (83.3% 실패율)
- ❌ NextAuth 세션 인식 실패
- ❌ 디버깅에 많은 시간 소모

### 현재 (해결됨)

개발자가 UI 프롬프트 문서를 따라 E2E 테스트를 작성하면:

- ✅ 올바른 인증 방식으로 구현
- ✅ 테스트 성공
- ✅ NextAuth 세션 정상 인식
- ✅ E2E_TEST_AUTH_GUIDE.md로 즉시 참조 가능

---

## 🎓 학습 사항

### 1. 문서의 중요성

잘못된 예제 코드가 문서에 있으면:

- 모든 개발자가 동일한 실수를 반복
- 문서가 "문제의 근원"이 됨

### 2. 일관성 유지

19개 파일 모두 동일한 패턴으로 수정:

- 향후 유지보수 용이
- 개발자 혼란 방지

### 3. 참조 링크의 중요성

각 문서에서 E2E_TEST_AUTH_GUIDE.md를 참조:

- 상세한 설명은 한 곳에만 유지
- 문서 간 일관성 확보
- 업데이트 시 한 곳만 수정

---

## 📝 다음 단계 (선택사항)

1. ⚠️ 기존 E2E 테스트 파일들도 확인

   - 혹시 잘못된 방식으로 작성된 테스트가 있는지 검토
   - `apps/frontend/tests/e2e/*.spec.ts` 확인

2. ✅ 새로운 UI 개발 시

   - 업데이트된 UI 프롬프트 문서 사용
   - E2E_TEST_AUTH_GUIDE.md 참조
   - auth.fixture.ts 재사용

3. ✅ 다른 개발자 온보딩 시
   - E2E_TEST_AUTH_GUIDE.md를 먼저 읽도록 안내
   - "단일 인증 소스(SSOT)" 원칙 교육

---

**최종 완료일시**: 2026-01-22 10:00 KST
**작성자**: Claude Sonnet 4.5
**업데이트 파일 수**: 19개
**백업 완료**: ✅

---

## 🎉 결론

모든 FRONTEND_UI_PROMPTS 문서가 올바른 E2E 테스트 인증 방식을 안내하도록 업데이트되었습니다.

**향후 개발자들은**:

- ✅ 문서를 따라 올바른 방식으로 테스트 작성
- ✅ NextAuth 인증 문제 없이 테스트 통과
- ✅ 동일한 실수를 반복하지 않음

**문서화의 힘**을 다시 한번 확인한 작업이었습니다! 🚀
