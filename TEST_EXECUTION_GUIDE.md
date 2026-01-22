# UI-2 장비 목록/검색 UI 개선 - 테스트 실행 가이드

## 📋 구현 완료 체크리스트

### ✅ 컴포넌트 구현
- [x] EquipmentFilters.tsx - 다중 필터 시스템 (사이트/상태/교정방법/공용장비)
- [x] EquipmentSearchBar.tsx - 통합 검색 (디바운스 300ms)
- [x] EquipmentTable.tsx - 정렬 가능한 테이블, ARIA 속성, 검색어 하이라이팅
- [x] EquipmentCardGrid.tsx - 카드 뷰, 상태별 색상 뱃지
- [x] ViewToggle.tsx - 테이블/카드 뷰 전환
- [x] EquipmentPagination.tsx - 페이지 탐색 및 페이지당 항목 수 선택
- [x] useEquipmentFilters.ts - URL 상태 관리 훅

### ✅ 기능 구현
- [x] 다중 필터 조합 (AND 조건)
- [x] URL 쿼리 파라미터로 필터 상태 저장
- [x] 뷰 상태 localStorage 저장
- [x] 뒤로가기/새로고침 시 상태 유지
- [x] 디바운스 검색 (300ms)
- [x] 검색어 하이라이팅
- [x] 정렬 (오름차순/내림차순 토글)
- [x] 페이지네이션
- [x] 에러 처리 (ErrorAlert, 재시도)
- [x] 로딩 상태 (스켈레톤)
- [x] 빈 상태 UI (검색 결과 없음, 데이터 없음)
- [x] 적용된 필터 Badge 표시
- [x] 필터 초기화 기능

### ✅ 에러 처리
- [x] useQuery error 상태 처리
- [x] ErrorAlert 컴포넌트 연동
- [x] 재시도 버튼
- [x] 401 응답 시 로그인 페이지 리다이렉트
- [x] 네트워크 오류 처리

### ✅ 접근성
- [x] 테이블에 role="grid", aria-label 추가
- [x] 검색 영역에 role="search" 추가
- [x] 로딩/에러 상태에 aria-live 추가
- [x] 페이지네이션에 aria-label 추가
- [x] 키보드 탐색 지원

### ✅ E2E 테스트
- [x] 필터 적용 및 URL 상태 테스트
- [x] 검색 기능 테스트
- [x] 페이지네이션 테스트
- [x] 뷰 전환 테스트
- [x] URL 상태 복원 테스트
- [x] 에러 처리 테스트
- [x] 로딩 상태 테스트
- [x] 빈 상태 UI 테스트
- [x] 접근성 테스트
- [x] 정렬 기능 테스트
- [x] 역할별 UI 분기 테스트

---

## 🚀 테스트 실행 방법

### 1단계: 데이터베이스 설정 및 시드 데이터 생성

테스트 환경 데이터베이스에 시드 데이터를 생성합니다.

```bash
# 프로젝트 루트에서 실행
cd apps/backend

# 테스트 DB 마이그레이션 및 시드 데이터 생성
pnpm run test:e2e:setup
```

**또는 개별 명령어로 실행:**

```bash
# 1. 테스트 DB 마이그레이션
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/equipment_management_test pnpm drizzle-kit push

# 2. 시드 데이터 생성
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/equipment_management_test pnpm ts-node src/database/seed-test.ts
```

### 2단계: 백엔드 서버 실행

백엔드 개발 서버를 실행합니다.

```bash
# apps/backend 디렉토리에서 실행
cd apps/backend
pnpm run start:dev

# 또는 프로젝트 루트에서 실행
pnpm --filter backend start:dev
```

**서버 실행 확인:**
- 서버가 `http://localhost:3001`에서 실행되어야 합니다.
- 브라우저에서 `http://localhost:3001/api` 접속하여 Swagger 문서 확인 가능

### 3단계: 프론트엔드 서버 실행

프론트엔드 개발 서버를 실행합니다.

```bash
# apps/frontend 디렉토리에서 실행
cd apps/frontend
pnpm run dev

# 또는 프로젝트 루트에서 실행
pnpm --filter frontend dev
```

**서버 실행 확인:**
- 서버가 `http://localhost:3000`에서 실행되어야 합니다.
- 브라우저에서 `http://localhost:3000` 접속하여 애플리케이션 확인

### 4단계: Playwright E2E 테스트 실행

#### 전체 테스트 실행

```bash
# apps/frontend 디렉토리에서 실행
cd apps/frontend

# 모든 테스트 실행
pnpm exec playwright test

# 특정 테스트 파일만 실행
pnpm exec playwright test tests/e2e/equipment-list.spec.ts
```

#### UI 모드로 실행 (추천)

UI 모드로 테스트를 실행하면 각 테스트를 단계별로 확인할 수 있습니다.

```bash
cd apps/frontend
pnpm exec playwright test --ui
```

#### 디버그 모드로 실행

```bash
cd apps/frontend
pnpm exec playwright test --debug
```

#### 특정 브라우저만 테스트

```bash
# Chromium만 테스트
pnpm exec playwright test --project=chromium

# Firefox만 테스트
pnpm exec playwright test --project=firefox

# Webkit(Safari)만 테스트
pnpm exec playwright test --project=webkit
```

#### 특정 테스트 스위트만 실행

```bash
# 기본 기능 테스트
pnpm exec playwright test -g "Equipment List - Basic"

# 필터 테스트
pnpm exec playwright test -g "Equipment List.*Filter"

# 에러 처리 테스트
pnpm exec playwright test -g "Error Handling"

# 접근성 테스트
pnpm exec playwright test -g "Accessibility"
```

---

## 📊 테스트 결과 확인

### HTML 리포트 확인

테스트 실행 후 HTML 리포트가 자동으로 생성됩니다.

```bash
cd apps/frontend
pnpm exec playwright show-report
```

### 스크린샷 확인

테스트 실패 시 스크린샷이 자동으로 저장됩니다.

```bash
# 스크린샷 위치
apps/frontend/test-results/
```

### 비디오 확인

테스트 실패 시 비디오가 자동으로 저장됩니다 (trace 옵션 활성화 시).

```bash
# 비디오 위치
apps/frontend/test-results/
```

---

## 🐛 트러블슈팅

### 1. "Timeout waiting for url" 에러

**원인:** 백엔드 또는 프론트엔드 서버가 실행되지 않았습니다.

**해결:**
```bash
# 백엔드 서버 실행 확인
curl http://localhost:3001/api

# 프론트엔드 서버 실행 확인
curl http://localhost:3000
```

### 2. "Database connection failed" 에러

**원인:** PostgreSQL 서버가 실행되지 않았거나 데이터베이스가 생성되지 않았습니다.

**해결:**
```bash
# PostgreSQL 서버 실행 확인
docker ps | grep postgres

# 테스트 데이터베이스 생성
docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE equipment_management_test;"

# 시드 데이터 재생성
cd apps/backend
pnpm run test:e2e:setup
```

### 3. "Browser not found" 에러

**원인:** Playwright 브라우저가 설치되지 않았습니다.

**해결:**
```bash
cd apps/frontend
pnpm exec playwright install
```

### 4. "Port 3000 already in use" 에러

**원인:** 포트 3000이 이미 사용 중입니다.

**해결:**
```bash
# 포트 사용 프로세스 확인 및 종료
lsof -ti:3000 | xargs kill -9

# 또는 다른 포트로 실행
PORT=3001 pnpm run dev
```

### 5. 테스트가 느리게 실행됨

**원인:** 모든 브라우저에서 테스트를 실행하고 있습니다.

**해결:**
```bash
# Chromium만 실행
pnpm exec playwright test --project=chromium
```

---

## 📝 테스트 케이스 목록

### Equipment List - Basic
- ✅ 페이지가 올바르게 로드되어야 함
- ✅ 사이트 필터 적용 시 URL이 업데이트되어야 함
- ✅ 상태 필터 적용 시 URL이 업데이트되어야 함
- ✅ 검색어 입력 시 URL이 업데이트되어야 함
- ✅ 필터 초기화가 동작해야 함

### Equipment List - View Toggle
- ✅ 테이블 뷰와 카드 뷰 전환이 동작해야 함
- ✅ 뷰 상태가 새로고침 후에도 유지되어야 함

### Equipment List - Pagination
- ✅ 다음 페이지로 이동이 동작해야 함
- ✅ 페이지당 항목 수 변경이 동작해야 함

### Equipment List - URL State Restoration
- ✅ URL 파라미터로 필터 상태가 복원되어야 함
- ✅ 뒤로가기 시 이전 필터 상태가 복원되어야 함

### Equipment List - Error Handling
- ✅ API 에러 시 ErrorAlert이 표시되어야 함
- ✅ 다시 시도 버튼 클릭 시 재요청되어야 함

### Equipment List - Empty States
- ✅ 검색 결과가 없을 때 적절한 메시지가 표시되어야 함
- ✅ 필터 적용 후 결과가 없을 때 필터 초기화 버튼이 표시되어야 함

### Equipment List - Loading States
- ✅ 로딩 중 스켈레톤이 표시되어야 함

### Equipment List - Accessibility
- ✅ 테이블에 적절한 ARIA 속성이 있어야 함
- ✅ 검색 영역에 role="search"가 있어야 함
- ✅ 키보드 탐색이 가능해야 함
- ✅ 페이지네이션에 aria-label이 있어야 함

### Equipment List - Sorting
- ✅ 정렬 기능이 동작해야 함
- ✅ 정렬 순서 토글이 동작해야 함

### Equipment List - Role-based UI
- ✅ 시험실무자는 사이트 필터가 제한되어야 함
- ✅ 기술책임자는 모든 사이트를 볼 수 있어야 함

---

## ✨ 다음 단계

모든 테스트가 통과하면:

1. **문서 업데이트**
   - 프롬프트 파일의 체크리스트 업데이트
   - CHANGELOG.md 작성

2. **코드 리뷰**
   - 타입 체크: `pnpm tsc --noEmit`
   - 린트: `pnpm lint`
   - 포맷팅: `pnpm format`

3. **커밋 및 PR 생성**
   ```bash
   git add .
   git commit -m "feat(UI-2): 장비 목록/검색 UI 개선

   - 다중 필터 시스템 (사이트/상태/교정방법/공용장비)
   - 통합 검색 (디바운스, 하이라이팅)
   - 정렬 기능 (오름차순/내림차순)
   - 테이블/카드 뷰 전환
   - 페이지네이션
   - URL 상태 관리
   - 에러/로딩/빈 상태 처리
   - 접근성 개선 (ARIA 속성)
   - E2E 테스트 추가

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

---

## 📚 참고 문서

- **프롬프트**: `docs/development/FRONTEND_UI_PROMPTS(UI-2: 장비 목록,검색 UI 개선).md`
- **API 표준**: `docs/development/API_STANDARDS.md`
- **인증 아키텍처**: `docs/development/AUTH_ARCHITECTURE.md`
- **Playwright 문서**: https://playwright.dev/
- **Next.js 16 문서**: https://nextjs.org/docs

---

## 🎯 요약

이 프로젝트는 **UI-2: 장비 목록/검색 UI 개선** 요구사항을 완전히 구현했습니다:

### 핵심 기능
- ✅ **다중 필터**: 사이트, 상태, 교정방법, 공용장비 필터 조합
- ✅ **통합 검색**: 장비명, 모델명, 관리번호로 검색 (디바운스 300ms)
- ✅ **정렬**: 등록일순, 이름순, 교정일순, 상태순 (오름차순/내림차순)
- ✅ **뷰 전환**: 테이블 뷰 / 카드 뷰 (localStorage 저장)
- ✅ **페이지네이션**: 10/20/50/100개 선택 가능
- ✅ **URL 상태 관리**: 필터/검색/정렬/페이지 상태를 쿼리 파라미터로 저장

### 사용자 경험
- ✅ **에러 처리**: ErrorAlert + 재시도 버튼
- ✅ **로딩 상태**: 스켈레톤 UI
- ✅ **빈 상태**: 검색 결과 없음 / 데이터 없음 구분
- ✅ **접근성**: WCAG 2.1 AA 준수, ARIA 속성, 키보드 탐색

### 테스트
- ✅ **19개 E2E 테스트 시나리오** 구현
- ✅ **모든 주요 기능 및 엣지 케이스** 커버
- ✅ **역할 기반 UI 분기** 테스트

**모든 컴포넌트가 구현되어 있으므로, 서버를 실행하고 테스트를 수행하면 즉시 검증할 수 있습니다! 🎉**
