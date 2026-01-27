# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-17: 소프트웨어 관리대장

### 목적

장비 소프트웨어/펌웨어 관리 페이지를 구현합니다.

### 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 소프트웨어 관리대장 페이지를 구현해줘.

요구사항:
1. 장비별 소프트웨어 페이지
   - 경로: /equipment/[id]/software
   - 설치된 소프트웨어/펌웨어 목록
   - 버전, 설치일, 라이선스 정보

2. 소프트웨어 등록/수정
   - 소프트웨어명, 버전
   - 설치일
   - 라이선스 유형 (영구/기간제)
   - 라이선스 만료일 (기간제)
   - 라이선스 키 (암호화 저장)

3. 전체 소프트웨어 관리대장
   - 경로: /software
   - 전체 소프트웨어 목록
   - 라이선스 만료 임박 알림
   - 장비별 그룹핑

4. 펌웨어 버전 관리
   - 현재 버전
   - 버전 이력
   - 업데이트 이력

파일:
- apps/frontend/app/equipment/[id]/software/page.tsx
- apps/frontend/app/software/page.tsx
- apps/frontend/components/software/SoftwareList.tsx
- apps/frontend/components/software/SoftwareForm.tsx
- apps/frontend/components/software/LicenseAlert.tsx
- apps/frontend/lib/api/software-api.ts

디자인 요구사항 (/frontend-design 스킬 활용):
- 라이선스 상태 뱃지 (유효/만료임박/만료)
- 만료 임박 경고 색상 (노란색/빨간색)

제약사항:
- 라이선스 키 암호화
- 만료 30일 전 알림

검증:
- 소프트웨어 등록 플로우
- 라이선스 만료 알림 테스트
- pnpm tsc --noEmit

Playwright 테스트:
- 소프트웨어 등록/수정

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

### 필수 가이드라인

- 라이선스 상태 뱃지 색상:
  - 유효 (녹색): 만료일 30일 이상 남음
  - 만료 임박 (노란색): 만료일 30일 이내
  - 만료 (빨간색): 만료됨
- 라이선스 키는 마스킹 처리 (앞 4자리만 표시)
- 펌웨어 버전 이력은 최신 5개만 기본 표시

### 이행 체크리스트 UI-17

- [ ] equipment/[id]/software/page.tsx 구현됨
- [ ] software/page.tsx 구현됨
- [ ] SoftwareList.tsx 컴포넌트 생성됨
- [ ] SoftwareForm.tsx 컴포넌트 생성됨
- [ ] LicenseAlert.tsx 컴포넌트 생성됨
- [ ] software-api.ts API 함수 생성됨
- [ ] 라이선스 만료 알림 구현됨
- [ ] Playwright 테스트 작성됨 (software.spec.ts)
- [ ] 모든 테스트 통과됨

### Playwright 테스트 예시

```typescript
// tests/e2e/software.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('소프트웨어 관리대장', () => {
  test('소프트웨어 등록', async ({ techManagerPage }) => {
    const page = techManagerPage;

    // 장비 소프트웨어 페이지 이동
    await page.goto('/equipment/1/software');
    await expect(page.getByRole('heading', { name: '소프트웨어 목록' })).toBeVisible();

    // 소프트웨어 추가
    await page.getByRole('button', { name: '소프트웨어 추가' }).click();

    // 폼 입력
    await page.getByLabel('소프트웨어명').fill('LabVIEW');
    await page.getByLabel('버전').fill('2023');
    await page.getByLabel('라이선스 유형').selectOption('subscription');
    await page.getByLabel('만료일').fill('2025-12-31');
    await page.getByLabel('라이선스 키').fill('XXXX-YYYY-ZZZZ-1234');

    // 저장
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('소프트웨어가 등록되었습니다')).toBeVisible();

    // 목록에 추가 확인
    await expect(page.getByText('LabVIEW')).toBeVisible();
    await expect(page.getByText('2023')).toBeVisible();
  });

  test('라이선스 만료 알림 표시', async ({ testOperatorPage }) => {
    const page = testOperatorPage;

    await page.goto('/software');

    // 만료 임박 알림 확인
    const expiringAlert = page.locator('[data-testid="license-expiring-alert"]');
    if (await expiringAlert.count() > 0) {
      await expect(expiringAlert.first()).toContainText('만료 예정');
    }

    // 만료 뱃지 확인
    const badges = page.locator('[data-testid="license-badge"]');
    await expect(badges.first()).toBeVisible();
  });

  test('전체 소프트웨어 관리대장 조회', async ({ siteAdminPage }) => {
    const page = siteAdminPage;

    await page.goto('/software');
    await expect(page.getByRole('heading', { name: '소프트웨어 관리대장' })).toBeVisible();

    // 장비별 그룹핑 확인
    const groupHeaders = page.locator('[data-testid="equipment-group"]');
    await expect(groupHeaders.first()).toBeVisible();
  });
});
```
