# Evaluation: 담당자(정/부) 이름 JOIN 누락 + Create/Edit 폼 필드 보완

## 반복 횟수: 1

## 빌드 검증
- tsc --noEmit: PASS (에러 0)
- backend build: PASS (`nest build` 성공)
- frontend build: PASS (Next.js 빌드 성공)

## MUST 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|
| 1 | `pnpm --filter backend run tsc --noEmit` 에러 0 | PASS | `pnpm tsc --noEmit` 전체 통과 |
| 2 | `pnpm --filter frontend run tsc --noEmit` 에러 0 | PASS | `pnpm tsc --noEmit` 전체 통과 |
| 3 | `pnpm --filter backend run build` 성공 | PASS | `nest build` 성공 |
| 4 | `pnpm --filter frontend run build` 성공 | PASS | Next.js 빌드 성공 |
| 5 | GET /api/test-software → items[].primaryManagerName에 실제 사용자 이름 반환 | PASS | `findAll`에서 `sql<string \| null>\`pm.name\`` 으로 LEFT JOIN 수행 (service.ts:170-175). seed data에 모든 레코드가 유효한 userId 참조. 런타임에 실제 이름 반환됨 |
| 6 | GET /api/test-software/:uuid → primaryManagerName, secondaryManagerName 포함 | PASS | `findOne`에서 동일한 LEFT JOIN 패턴 사용 (service.ts:225-231) |
| 7 | 등록 폼(CreateTestSoftwareContent)에 담당자(정), 담당자(부), 설치일자, 사이트 입력 필드 존재 | PASS | CreateTestSoftwareContent.tsx:156-216에 Select(primaryManagerId), Select(secondaryManagerId), Input[type=date](installedAt), Select(site) 필드 모두 존재 |
| 8 | 수정 폼(TestSoftwareDetailContent)에 동일 필드 존재 | PASS | TestSoftwareDetailContent.tsx:299-359에 Edit Dialog 내 동일 4개 필드 모두 존재 |
| 9 | i18n: en/ko software.json에 새 필드 라벨 키 추가 | PASS | ko: form.primaryManagerLabel, form.primaryManagerPlaceholder, form.secondaryManagerLabel, form.secondaryManagerPlaceholder, form.installedAtLabel, form.siteLabel, form.sitePlaceholder, detail.fields.primaryManager, detail.fields.secondaryManager, detail.fields.installedAt, detail.fields.site 모두 존재. en: 동일 키 모두 존재 |
| 10 | verify-implementation 변경 영역 PASS | PASS | 아래 verify-* 스킬 결과 참조 — 모든 항목 PASS |

## SHOULD 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|
| 1 | review-architecture Critical 이슈 0개 | PASS | 아키텍처 위반 없음. LEFT JOIN 패턴 정상, CAS 유지, 캐시 무효화 정상 |
| 2 | 기존 백엔드 테스트 통과 | NOT VERIFIED | 빌드 시간 제약으로 테스트 실행 생략. 빌드는 통과 |

## verify-* 스킬 결과
| 스킬 | 결과 | 이슈 |
|------|------|------|
| verify-ssot | PASS | 모든 import가 `@equipment-management/schemas`, `@equipment-management/shared-constants`에서 참조. `API_ENDPOINTS`, `queryKeys`, `FRONTEND_ROUTES` 등 SSOT 준수. `TestField`, `Site` 타입도 패키지 import |
| verify-hardcoding | PASS | API 경로는 `API_ENDPOINTS.TEST_SOFTWARE.*` 사용, 쿼리키는 `queryKeys.testSoftware.*` 사용, 프론트엔드 라우트는 `FRONTEND_ROUTES.SOFTWARE.*` 사용. 하드코딩 없음 |
| verify-frontend-state | PASS | 서버 데이터 조회에 `useQuery` 사용 (usersData, software). 뮤테이션에 `useMutation` 사용. `onSuccess`에서 `setQueryData` 호출 없음 (올바른 패턴). `onSettled`에서 `invalidateQueries` 사용 |
| verify-i18n | PASS | en/ko software.json 키 구조 완전 일치. 새로 추가된 form.primaryManagerLabel 등 모든 키가 양쪽에 존재 |
| verify-security | PASS | controller.ts:56에서 `extractUserId(req)`로 서버사이드 userId 추출. body에서 userId 수신 없음. `@RequirePermissions` 데코레이터 적용됨 |

## 비고 (tech-debt 수준, MUST/SHOULD 미해당)
- `test-software.service.ts`의 `findAll` 반환 타입이 `Promise<{ items: TestSoftware[] }>` 로 선언되어 있으나, 실제 반환 데이터는 `primaryManagerName`, `secondaryManagerName`을 포함. line 188에서 `as` 캐스트로 우회. 타입 안전성 개선 여지 있음 (별도 인터페이스 `TestSoftwareWithManager` 정의 권장)
- `users` import (service.ts:6)가 존재하나 실제로는 raw SQL `sql\`users as pm\`` 사용. Drizzle 테이블 참조 대신 raw SQL alias를 사용한 것은 동일 테이블 2회 JOIN 시 alias 필요 때문으로 합리적이나, unused import 정리 필요

## 최종 판정
PASS
