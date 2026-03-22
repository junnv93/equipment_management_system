---
name: review-architecture
description: 아키텍처 레벨 코드 리뷰 스킬. 변경된 코드의 DB→Service→Controller→DTO→Hook→Component→Cache 계층 관통 검증, 모듈 간 패턴 일관성, CAS 계층 일관성, 캐시 코히어런스, 보안 계층, 성능 안티패턴을 리뷰합니다. "아키텍처 리뷰", "코드 리뷰", "전체 리뷰", "PR 리뷰", "구조 검토", "패턴 일관성 확인" 등의 맥락에서 사용하세요. verify-* 스킬이 규칙 기반 자동 검사라면, 이 스킬은 시니어 아키텍트 관점의 설계 판단 리뷰입니다. 코드 변경 후 구조적 일관성이 궁금할 때, PR 생성 전 아키텍처 수준 점검이 필요할 때 적극 사용하세요.
argument-hint: '[선택사항: 특정 도메인명 또는 파일 경로]'
---

# 아키텍처 레벨 코드 리뷰

## Purpose

이 스킬은 **verify-* 스킬과 상호보완적**입니다:

- **verify-* 스킬**: Grep 패턴 매칭으로 규칙 위반을 자동 탐지 (정답이 명확한 검사)
- **이 스킬**: 시니어 아키텍트 관점에서 계층 간 일관성, 설계 판단, 성능 영향을 리뷰 (맥락 판단 필요)

코드가 "규칙을 지키는가"가 아니라 "아키텍처적으로 올바른 위치에 올바른 패턴으로 구현되었는가"를 검증합니다.

### 핵심 철학: 임시방편이 아닌 시스템 전반 개선

이 스킬의 리뷰어는 **현재 문제를 단편적으로 해결하는 것이 아니라, 아키텍처 수준에서 시스템 전반의 개선을 추구**합니다. 모든 리뷰 판단에서 다음 원칙을 적용합니다:

- **SSOT 사고**: 새 코드가 이미 존재하는 유틸리티/헬퍼/패턴을 재사용하는가? 새로 만든 로직이 기존 것과 중복되지 않는가? (verify-ssot이 "import 소스"를 검사한다면, 이 스킬은 "로직 수준의 SSOT"를 검사)
- **하드코딩 방지**: 값 수준 하드코딩은 verify-hardcoding이 담당하지만, **설계 결정의 하드코딩**(특정 역할에 대한 if-else 체인, 매직 넘버로 된 비즈니스 규칙 등)은 이 스킬이 판단
- **성능 전략**: 안티패턴 체크리스트를 넘어, 데이터 증가에 따른 확장성과 캐시 전략의 적절성을 아키텍처 수준에서 판단

## When to Run

- 새 모듈/기능을 구현한 후 — 기존 모듈과 패턴이 일치하는지 확인
- PR 생성 전 — 계층 간 누락이 없는지 최종 점검
- 복잡한 상태 변경 로직 추가 후 — CAS/캐시/에러 전파가 올바른지 확인
- 성능에 영향을 줄 수 있는 쿼리/캐시 변경 후

## Workflow

### Step 1: 변경 범위 파악

먼저 리뷰 대상을 식별합니다.

**인수가 제공된 경우:** 해당 도메인/파일만 리뷰합니다.

**인수가 없는 경우:** git diff로 변경된 파일을 파악합니다.

```bash
# 스테이징 + 언스테이징 변경 파일
git diff --name-only HEAD
git diff --name-only --cached
git diff --name-only
```

변경 파일이 없으면 사용자에게 리뷰 대상을 질문합니다.

변경된 파일들을 도메인별로 그룹화합니다:

```markdown
## 리뷰 대상

| 도메인 | 변경 파일 | 변경 유형 |
|---|---|---|
| equipment | `equipment.service.ts`, `EquipmentForm.tsx` | 기능 추가 |
| checkouts | `checkouts.controller.ts` | 엔드포인트 추가 |
```

### Step 2: 계층 관통 추적

각 도메인의 변경이 **모든 관련 계층에 반영**되었는지 추적합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "1. 계층 관통 추적" 섹션을 참조합니다.

**백엔드 변경 시 확인:**

1. DB 스키마 변경 → DTO에 반영? → Zod schema 업데이트? (누락 시 API 응답과 타입이 불일치하여 프론트엔드 런타임 에러)
2. 새 엔드포인트 → `@RequirePermissions` 적용? → `@AuditLog` 적용? (누락 시 무권한 접근 + 감사 추적 불가)
3. 상태 변경 로직 → CAS 적용? → 캐시 무효화 전략? (누락 시 동시 수정으로 데이터 덮어쓰기)
4. 새 에러 코드 → `GlobalExceptionFilter`에서 처리? → 프론트엔드 매핑? (누락 시 사용자에게 generic "오류 발생" 표시 → 해결 불가)

**프론트엔드 변경 시 확인:**

1. 새 API 호출 → `queryKeys`에 등록? → 적절한 `CACHE_TIMES` 프리셋? (미등록 시 mutation 후 캐시 무효화가 해당 쿼리에 적용되지 않아 stale 데이터 표시)
2. mutation → `useOptimisticMutation` 사용? → 캐시 무효화? (직접 useMutation 시 VERSION_CONFLICT 처리, 롤백, 캐시 무효화를 모두 수동 구현해야 함)
3. 새 페이지 → Server/Client Component 분리? → loading.tsx/error.tsx? (미분리 시 전체 페이지가 클라이언트 번들에 포함되어 초기 로딩 지연)
4. 필터 추가 → URL searchParams 기반? → filter-utils 활용? (useState 사용 시 새로고침/공유 시 필터 상태 유실)

**누락 발견 시 보고:**

```markdown
### [Warning] 계층 누락: {도메인}

- **변경**: `modules/xxx/xxx.service.ts` — 새 상태 변경 메서드 추가
- **누락 계층**: 프론트엔드 에러 코드 매핑
- **영향**: 새 에러 코드가 프론트엔드에서 generic 에러로 표시됨
- **수정안**: `equipment-errors.ts`의 `mapBackendErrorCode`에 매핑 추가
- **참고**: checkouts 도메인의 동일 패턴 참조 (`checkouts.service.ts:L200`)
```

### Step 3: CAS 계층 일관성 (상태 변경이 있는 경우)

변경된 코드에 상태 변경 로직이 포함되어 있다면, CAS 패턴이 DB → Backend → Frontend 전 계층에서 일관되게 적용되었는지 확인합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "2. CAS 계층 일관성" 섹션을 참조합니다.

핵심 확인 사항:

- 새 상태 변경 엔드포인트에 `version` 필드가 DTO에 포함되는가? (미포함 시 동시 수정을 감지할 수 없어 마지막 쓰기가 이전 변경을 침묵 덮어쓰기)
- `VersionedBaseService.updateWithVersion()` 사용하는가? (직접 UPDATE 시 WHERE version=? 조건이 누락되어 CAS 무력화)
- CAS 실패(409) catch에서 해당 엔티티 캐시 삭제하는가? (미삭제 시 stale version이 캐시에 남아 재시도도 계속 409 — 무한 충돌 루프)
- 프론트엔드 mutation에서 version 전송 + VERSION_CONFLICT 처리하는가? (미처리 시 사용자가 "오류 발생"만 보고 원인을 알 수 없음)

### Step 4: 캐시 코히어런스

변경된 코드가 캐시에 영향을 주는지 확인합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "3. 캐시 코히어런스" 섹션을 참조합니다.

핵심 확인 사항:

- 상태 변경 후 관련 캐시가 모두 무효화되는가? (교차 엔티티 포함 — 예: 부적합 생성 시 장비 캐시 + 대시보드 캐시도 무효화하지 않으면 대시보드에 stale 통계 표시)
- `CacheInvalidationHelper`의 교차 무효화 패턴을 따르는가? (인라인으로 캐시 삭제 코드를 작성하면 다른 모듈에서 동일 엔티티 변경 시 누락 발생 — 중앙 헬퍼가 교차 관계를 한 곳에서 관리)
- 프론트엔드 mutation 성공 시 관련 query가 무효화되는가? (미무효화 시 목록 페이지가 stale 데이터 표시 — 사용자가 "승인했는데 왜 아직 대기 중?")
- 캐시 무효화 범위가 과도하지 않은가? (전체 플러시는 모든 캐시를 날려 동시 사용자 전원의 다음 요청이 DB 직접 조회 → 순간 부하 급증)

### Step 5: 모듈 간 패턴 일관성 + 로직 SSOT

새로 추가되거나 수정된 코드가 기존 모듈의 패턴과 일치하는지 확인합니다. 또한 **로직 수준의 SSOT**를 검증합니다 — verify-ssot이 import 소스를, verify-hardcoding이 값 하드코딩을 잡는다면, 이 Step은 "이미 존재하는 로직을 다시 작성하지 않았는가"를 확인합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "6. 모듈 간 패턴 일관성" 섹션을 참조합니다.

#### 5a: 비교 대상 선정

변경된 도메인과 가장 유사한 기존 모듈을 식별합니다.

| 변경 도메인 | 비교 대상 | 이유 |
|---|---|---|
| 새 CRUD 모듈 | equipment | 가장 완성도 높은 CRUD |
| 1-step 승인 | checkouts | 승인 플로우 표준 |
| 3-step 승인 | calibration-plans | 다단계 승인 표준 |
| 이벤트 기반 | checkouts | 이벤트 방출 표준 |

비교 대상 모듈의 해당 파일을 읽고, 새 코드와의 패턴 차이를 식별합니다.

#### 5b: 로직 수준 SSOT 검증

새로 작성된 코드가 기존 유틸리티/헬퍼/패턴을 재사용하지 않고 동일 로직을 재구현하지 않았는지 확인합니다. 이것은 중복 코드 문제가 아니라, 시스템 전반의 일관성 문제입니다 — 같은 비즈니스 로직이 두 곳에 존재하면 한쪽만 수정될 때 불일치가 발생합니다.

확인 항목:

- **캐시 무효화를 인라인으로 작성하지 않았는가?** → `CacheInvalidationHelper`에 이미 교차 무효화 메서드가 있는지 확인. 없으면 헬퍼에 추가하고 호출하는 것이 올바른 패턴 (새 모듈이 같은 엔티티를 변경할 때 무효화가 자동 적용되기 때문)
- **에러 응답 생성을 직접 작성하지 않았는가?** → `AppError` 또는 기존 에러 팩토리 패턴을 재사용하는지 확인
- **상태 전이 검증을 인라인으로 작성하지 않았는가?** → 기존 상태 전이 로직과 일관된 패턴을 사용하는지 확인
- **새 enum 값 추가 시 기존 switch/if-else 체인이 이를 처리하는가?** → 새 상태를 추가했는데 기존 모듈의 상태 분기가 이를 고려하지 않으면, default에 빠져 예상치 못한 동작 발생

**로직 SSOT 위반 발견 시:**

```markdown
### [Warning] 로직 SSOT 위반: {파일명}

- **현재 코드**: 캐시 무효화를 인라인으로 3줄 작성
- **기존 SSOT**: `CacheInvalidationHelper.invalidateAfterEquipmentUpdate()` 존재
- **영향**: 다른 모듈이 같은 엔티티 변경 시 이 인라인 무효화 로직이 누락됨
- **수정안**: `CacheInvalidationHelper`에 메서드 추가/재사용
```

#### 5c: 패턴 불일치

**패턴 불일치 발견 시:**

```markdown
### [Warning] 패턴 불일치: {파일명}

- **현재 코드**: 쿼리 조건을 인라인으로 구성
- **기존 패턴**: QueryConditions 인터페이스 사용 (equipment.service.ts)
- **판단**: 쿼리 복잡도가 낮아 인라인이 적절 / 복잡하므로 인터페이스 패턴 권장
- **참고**: `modules/equipment/equipment.service.ts:L150`
```

### Step 6: 성능 리뷰

성능에 영향을 줄 수 있는 패턴을 확인합니다. 단순 안티패턴 체크를 넘어, **아키텍처 수준의 성능 판단**도 수행합니다 — 현재 데이터 규모에서는 작동하더라도, 데이터가 증가하면 병목이 될 수 있는 설계를 사전에 식별합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "5. 성능 안티패턴" 섹션을 참조합니다.

#### 6a: 알려진 안티패턴 (즉시 수정 필요)

**백엔드:**
- Drizzle ORM: correlated subquery 사용 없는가? (메인 쿼리 행마다 서브쿼리 실행 — 장비 1000대면 1000번 서브쿼리)
- N+1 쿼리: 루프 내 쿼리 실행 없는가? (10건 조회 후 각각 관계 테이블 조회 → 11 쿼리. 배치 조회 + Map 매핑으로 2 쿼리로 축소)
- 이벤트 방출: 에러 바운더리 있는가? (핸들러 실패 → 요청 크래시 방지. 핵심 로직은 성공했는데 알림 발송 실패로 사용자에게 500 반환)
- 불필요한 트랜잭션: CAS 단일 테이블 업데이트에 트랜잭션 사용하지 않는가? (WHERE version=? 조건이 원자성을 보장하므로 트랜잭션 오버헤드 불필요)

**프론트엔드:**
- Server Component에서 가능한 작업을 Client Component로 넘기지 않았는가? (불필요한 JavaScript 번들 증가 → 모바일에서 초기 로딩 지연)
- `onSuccess`에서 `setQueryData` 사용하지 않는가? (TData와 TCachedData 타입 불일치 75% — 서버 데이터를 클라이언트가 추측하면 stale 데이터 표시)
- 무한 re-render 유발 패턴 없는가? (useEffect 의존성에 객체/배열 리터럴 → 매 렌더링마다 새 참조 생성 → 무한 루프)

#### 6b: 확장성 판단 (Info/Warning 수준)

현재 코드가 데이터 증가에도 안전한지 아키텍처 수준에서 판단합니다:

- **쿼리 복잡도**: JOIN이 3개 이상 체인되거나, 서브쿼리가 중첩되면 데이터 증가 시 실행 계획이 급격히 나빠질 수 있음. 필요한 데이터만 조회하는 projection(SELECT 컬럼 제한)이 적용되었는가?
- **캐시 전략 적절성**: staleTime이 30초인데 데이터가 거의 변하지 않는 경우(teams, 설정) → REFERENCE(30분) 프리셋이 적절. 반대로 REFERENCE인데 자주 변하는 데이터 → 사용자가 stale 데이터를 오래 봄
- **목록 조회 페이지네이션**: LIMIT/OFFSET 없이 전체 조회하는 엔드포인트는 없는가? (장비 1000대 → 10000대 증가 시 응답 시간 선형 증가)
- **캐시 무효화 범위**: 한 건 수정에 관련 캐시 10개 이상을 무효화하면, 동시 사용자가 많을 때 캐시 히트율이 급락하여 DB 부하 급증

**확장성 이슈 발견 시:**

```markdown
### [Info] 확장성 고려: {파일명}

- **현재 코드**: 장비 목록 조회에서 모든 관계 테이블을 JOIN
- **현재 성능**: 장비 500대 기준 ~200ms (허용 범위)
- **확장 시 위험**: 장비 5000대 이상에서 JOIN 결과 행 수 기하급수 증가
- **대안**: 필요한 관계만 선택적 JOIN 또는 별도 쿼리로 분리
```

### Step 7: 보안 리뷰

상태 변경 엔드포인트의 보안 계층을 확인합니다.

상세 체크리스트는 [references/review-checklist.md](references/review-checklist.md)의 "4. 보안 계층" 섹션을 참조합니다.

- userId가 `req.user.userId`에서 추출되는가? (body/query 신뢰 시 클라이언트가 다른 사용자의 userId를 전송하여 권한 우회 가능)
- `@RequirePermissions(Permission.XXX)` 적용되었는가? (미적용 시 인증만 되면 모든 사용자가 관리자 기능에 접근 가능)
- `@AuditLog()` 데코레이터가 mutation 엔드포인트에 적용되었는가? (미적용 시 데이터 변경 이력이 남지 않아 문제 발생 시 추적 불가 — UL-QP-18 감사 요구사항 위반)

### Step 8: 리뷰 보고서

모든 검토 결과를 통합 보고서로 출력합니다.

```markdown
## 아키텍처 리뷰 보고서

### 요약

| 영역 | 상태 | 발견 사항 |
|---|---|---|
| 계층 관통 | OK / N개 누락 | 요약 |
| CAS 일관성 | OK / N개 이슈 | 요약 |
| 캐시 코히어런스 | OK / N개 이슈 | 요약 |
| 패턴 일관성 | OK / N개 불일치 | 요약 |
| 로직 SSOT | OK / N개 중복 | 요약 |
| 성능 안티패턴 | OK / N개 안티패턴 | 요약 |
| 확장성 | OK / N개 고려사항 | 요약 |
| 보안 | OK / N개 이슈 | 요약 |

### 발견된 이슈 (심각도순)

#### [Critical] 제목
- **파일**: `path/to/file.ts:42`
- **문제**: 구체적 설명
- **영향**: 시스템 전반 파급 효과
- **수정안**: 구체적 코드 제시
- **참고 패턴**: 이미 올바른 유사 모듈/파일 경로
- **검증**: `pnpm --filter backend run tsc --noEmit`

#### [Warning] 제목
...

#### [Info] 제목
...

### 권장 사항
- 이슈가 없으면: "아키텍처 리뷰를 통과했습니다."
- 이슈가 있으면: 우선순위별 수정 권장 및 검증 명령어
```

### Step 9: 자체 학습

리뷰를 마친 후, 이번 리뷰에서 **이 스킬의 체크리스트나 예외를 개선할 학습**이 있었는지 점검합니다.

먼저 [references/review-learnings.md](references/review-learnings.md)를 읽어 기존 학습 기록을 확인합니다.

다음 3가지를 확인합니다:

**9a: 체크리스트에 없던 검사를 수행했는가?**

Step 2-7에서 체크리스트에 명시되지 않은 항목을 확인한 경우, `review-checklist.md` 해당 섹션에 추가하고 `review-learnings.md`에 기록합니다.

**9b: 사용자가 이슈를 의도된 설계로 확인했는가?**

사용자가 "이건 의도적이야", "이건 괜찮아" 등으로 응답한 이슈가 있으면, Exceptions 섹션에 추가하고 `review-learnings.md`에 기록합니다.

**9c: 반복 발견 안티패턴이 있는가?**

`review-learnings.md`에 이미 기록된 안티패턴이 다시 발견되면(2회 이상), `review-checklist.md`에 명시적 검사 항목으로 승격합니다. 처음 발견된 안티패턴은 `review-learnings.md`에만 기록합니다.

개선 사항이 있으면 보고서 하단에 한 줄로 표시합니다:

```markdown
> 이 리뷰를 통해 체크리스트 N개 항목, 예외 M개가 업데이트되었습니다.
```

## 심각도 기준

| 심각도 | 기준 | 예시 |
|---|---|---|
| **Critical** | 프로덕션 버그, 데이터 정합성, 보안 취약점 | CAS 누락으로 데이터 덮어쓰기 가능, userId body 신뢰 |
| **Warning** | 패턴 불일치, 캐시 누락, 성능 영향 | 교차 캐시 무효화 누락, 에러 코드 매핑 누락 |
| **Info** | 개선 제안, 일관성 향상 | 반환 타입 명시, 쿼리 빌더 패턴 통일 |

## 리뷰하지 않는 것

이 스킬은 다음을 **리뷰하지 않습니다** (verify-* 스킬 또는 lint가 담당):

- 코드 스타일, 포맷팅, 주석 (lint 담당)
- SSOT import 소스 — 타입/enum이 올바른 패키지에서 import 되는가 (verify-ssot 담당). 단, **로직 수준의 SSOT**(기존 유틸리티 재사용 여부)는 이 스킬이 Step 5b에서 검사
- 값 수준 하드코딩 — API 경로, queryKeys, 환경변수, 캐시 키 등의 매직 스트링 (verify-hardcoding 담당). 단, **설계 수준의 하드코딩**(비즈니스 규칙의 인라인 분기 등)은 이 스킬이 판단
- Zod 검증 패턴 (verify-zod 담당)
- Design Token 규칙 (verify-design-tokens 담당)
- i18n 번역 일관성 (verify-i18n 담당)

## Exceptions

다음은 **이슈로 보고하지 않습니다**:

1. **CalibrationPlans의 casVersion 사용** — version과 casVersion 분리는 의도적 설계 (계획서 개정 이력 vs CAS)
2. **컨트롤러의 중복 `@UseGuards(JwtAuthGuard)`** — 글로벌 가드와 중복이지만 방어적 코딩으로 허용
3. **단순 모듈의 인라인 쿼리 조건** — 쿼리 복잡도가 낮은 경우 QueryConditions 인터페이스 불필요
4. **프론트엔드 UI 표시용 로컬 상수** — STATUS_LABELS, STATUS_COLORS 등은 UI 전용
5. **테스트 파일의 패턴 차이** — 테스트는 프로덕션 코드와 다른 패턴 허용

## Related Files

| File | Purpose |
|---|---|
| [references/review-checklist.md](references/review-checklist.md) | 도메인별 상세 체크리스트 |
| [references/review-learnings.md](references/review-learnings.md) | 리뷰 학습 기록 (패턴, 예외, 안티패턴 축적) |
| `CLAUDE.md` | 프로젝트 전체 지침 |
| `.claude/skills/verify-implementation/SKILL.md` | 규칙 기반 통합 검증 (상호보완) |
| `apps/backend/src/common/base/versioned-base.service.ts` | CAS 기본 클래스 |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | 캐시 교차 무효화 |
| `apps/frontend/hooks/use-optimistic-mutation.ts` | 프론트엔드 CAS 처리 |
| `apps/frontend/lib/api/cache-invalidation.ts` | 프론트엔드 캐시 무효화 |
| `apps/frontend/lib/errors/equipment-errors.ts` | 에러 코드 매핑 |
