---
name: review-architecture
description: 아키텍처 레벨 코드 리뷰 스킬. 변경된 코드의 DB→Service→Controller→DTO→Hook→Component→Cache 계층 관통 검증, 모듈 간 패턴 일관성, CAS 계층 일관성, 캐시 코히어런스, 보안 계층, 성능 안티패턴을 리뷰합니다. verify-* 스킬이 규칙 기반 자동 검사라면, 이 스킬은 시니어 아키텍트 관점의 설계 판단 리뷰입니다. "아키텍처 리뷰", "코드 리뷰", "전체 리뷰", "PR 리뷰", "구조 검토", "패턴 일관성 확인", "review changes", "check architecture", "리뷰해줘" 등의 맥락에서 사용하세요. 특히 새 모듈 추가, 복잡한 상태 변경 로직, 다단계 승인 플로우 구현, 캐시 전략 변경 후에 적극 사용하세요. 코드 변경 후 구조적 일관성이 궁금할 때, PR 생성 전 아키텍처 수준 점검이 필요할 때 적극 사용하세요.
argument-hint: '[선택사항: 특정 도메인명 또는 파일 경로]'
---

# 아키텍처 레벨 코드 리뷰

## Purpose

이 스킬은 **verify-* 스킬과 상호보완적**입니다:

- **verify-* 스킬**: Grep 패턴 매칭으로 규칙 위반을 자동 탐지 (정답이 명확한 검사)
- **이 스킬**: 시니어 아키텍트 관점에서 계층 간 일관성, 설계 판단, 성능 영향을 리뷰 (맥락 판단 필요)

코드가 "규칙을 지키는가"가 아니라 "아키텍처적으로 올바른 위치에 올바른 패턴으로 구현되었는가"를 검증합니다.

### 핵심 철학

- **SSOT 사고**: 새 코드가 이미 존재하는 유틸리티/헬퍼/패턴을 재사용하는가? (verify-ssot이 "import 소스"를 검사한다면, 이 스킬은 "로직 수준의 SSOT"를 검사)
- **하드코딩 방지**: 값 수준은 verify-hardcoding이 담당하지만, **설계 결정의 하드코딩**(if-else 체인, 매직 넘버 비즈니스 규칙 등)은 이 스킬이 판단
- **성능 전략**: 안티패턴 체크리스트를 넘어, 데이터 증가에 따른 확장성과 캐시 전략 적절성을 아키텍처 수준에서 판단

## Workflow

### Step 1: 변경 범위 파악 (순차 — 모든 스트림의 입력)

먼저 리뷰 대상을 식별합니다.

**인수가 제공된 경우:** 해당 도메인/파일만 리뷰합니다.

**인수가 없는 경우:** git diff로 변경된 파일을 파악합니다.

```bash
git diff --name-only HEAD
git status --short
```

변경 파일이 없으면 사용자에게 리뷰 대상을 질문합니다.

변경된 파일들을 **3개 스트림**으로 분류합니다:

| 스트림 | 대상 파일 패턴 | 리뷰 영역 |
|---|---|---|
| **Backend** | `modules/*/`, `common/`, `database/`, `packages/db/` | CAS, 캐시, 보안, 성능(백엔드) |
| **Frontend** | `app/`, `components/`, `hooks/`, `lib/` | 상태 아키텍처, 캐시 무효화, 에러 전파, 성능(프론트) |
| **Cross-cutting** | 양쪽 모두 변경된 도메인 | 계층 관통, 모듈 패턴 일관성, 로직 SSOT |

```markdown
## 리뷰 대상

| 도메인 | 변경 파일 | 변경 유형 | 스트림 |
|---|---|---|---|
| equipment | `equipment.service.ts` | 기능 추가 | Backend + Cross |
| equipment | `EquipmentForm.tsx` | UI 변경 | Frontend + Cross |
| checkouts | `checkouts.controller.ts` | 엔드포인트 추가 | Backend |
```

### Step 2: 병렬 리뷰 실행

변경 파일이 존재하는 스트림만 Agent tool로 **동시에** 실행합니다. 하나의 메시지에서 2~3개 Agent 호출을 병렬로 보냅니다.

변경이 백엔드만이면 Backend 1개, 프론트엔드만이면 Frontend 1개, 양쪽 모두면 3개 스트림 모두 실행합니다.

각 Agent에게 전달할 프롬프트 템플릿:

---

#### Stream A: Backend Review Agent

```
아키텍처 리뷰 — 백엔드 스트림

## 리뷰 대상 파일
{백엔드 변경 파일 목록}

## 체크리스트
references/review-checklist.md의 다음 섹션을 참조하여 리뷰:
- 섹션 2: CAS 계층 일관성 (상태 변경이 있는 경우)
- 섹션 3: 캐시 코히어런스 (백엔드 부분)
- 섹션 4: 보안 계층
- 섹션 5a: 성능 안티패턴 (백엔드)
- 섹션 5b: 확장성 판단

## 기존 학습
references/review-learnings.md를 읽고, 이전에 발견된 안티패턴이 재발하는지 확인

## 핵심 확인 사항
1. 새 상태 변경 → version DTO 포함? VersionedBaseService 사용? CAS 실패 시 캐시 삭제?
2. 새 엔드포인트 → @RequirePermissions? @AuditLog? req.user.userId 서버 추출?
3. 캐시 무효화 → CacheInvalidationHelper 패턴? 교차 엔티티 무효화?
4. 쿼리 성능 → N+1? correlated subquery? 불필요한 트랜잭션?
5. Pending 목록 엔드포인트 → @SiteScoped 적용?

## Exceptions (이슈로 보고하지 않는 것)
- CalibrationPlans의 casVersion 사용 (의도적 설계)
- 컨트롤러 중복 @UseGuards(JwtAuthGuard) (방어적 코딩)
- 단순 모듈의 인라인 쿼리 조건 (복잡도 낮으면 허용)
- 테스트 파일의 패턴 차이

## 출력 형식
각 발견을 다음 형식으로 보고:
### [{Critical|Warning|Info}] 제목
- **파일**: `path/to/file.ts:line`
- **문제**: 구체적 설명
- **영향**: 시스템 파급 효과
- **수정안**: 구체적 코드 또는 접근법
- **참고 패턴**: 올바른 유사 구현 경로

발견 없으면 "백엔드 리뷰: 이슈 없음" 보고
```

---

#### Stream B: Frontend Review Agent

```
아키텍처 리뷰 — 프론트엔드 스트림

## 리뷰 대상 파일
{프론트엔드 변경 파일 목록}

## 체크리스트
references/review-checklist.md의 다음 섹션을 참조하여 리뷰:
- 섹션 3: 캐시 코히어런스 (프론트엔드 부분)
- 섹션 5a: 성능 안티패턴 (프론트엔드)
- 섹션 7: 프론트엔드 상태 아키텍처
- 섹션 8: 에러 전파 체인

## 기존 학습
references/review-learnings.md를 읽고, 이전에 발견된 안티패턴이 재발하는지 확인

## 핵심 확인 사항
1. 서버 상태 → TanStack Query 사용? (useState 금지)
2. mutation → useOptimisticMutation? onSuccess에서 setQueryData 미사용?
3. queryKeys 팩토리 등록? 적절한 CACHE_TIMES 프리셋?
4. 캐시 무효화 → EquipmentCacheInvalidation 정적 메서드 활용? invalidation→navigation 순서?
5. 필터 → URL searchParams 기반? filter-utils 활용?
6. Server/Client Component 분리? loading.tsx/error.tsx?
7. VERSION_CONFLICT 에러 특별 처리? mapBackendErrorCode 매핑?
8. Radix Select spurious onValueChange 가드?

## Exceptions
- 프론트엔드 UI 표시용 로컬 상수 (STATUS_LABELS 등)
- 테스트 파일의 패턴 차이

## 출력 형식
[Backend Agent와 동일한 형식]
```

---

#### Stream C: Cross-cutting Review Agent

이 스트림은 **백엔드와 프론트엔드 양쪽에 변경이 있는 도메인**이 존재할 때만 실행합니다. 한쪽만 변경되었으면 스킵합니다.

```
아키텍처 리뷰 — 교차 계층 스트림

## 리뷰 대상 도메인
{양쪽에 변경이 있는 도메인 목록과 전체 변경 파일}

## 체크리스트
references/review-checklist.md의 다음 섹션을 참조하여 리뷰:
- 섹션 1: 계층 관통 추적
- 섹션 6: 모듈 간 패턴 일관성 + 로직 SSOT

## 기존 학습
references/review-learnings.md를 읽고, 이전에 발견된 패턴/안티패턴 확인

## 핵심 확인 사항

### 계층 관통
1. DB 스키마 변경 → DTO 반영? → Zod schema? → 프론트엔드 타입?
2. 새 엔드포인트 → 프론트엔드 API 클라이언트 연동?
3. 새 에러 코드 → GlobalExceptionFilter → mapBackendErrorCode → ERROR_MESSAGES?
4. 카운트 쿼리↔목록 쿼리 데이터 소스 일치?

### 패턴 일관성 + 로직 SSOT
1. 비교 대상 모듈 선정:
   - 새 CRUD → equipment, 1-step 승인 → checkouts, 3-step → calibration-plans
2. 캐시 무효화 인라인 작성 → CacheInvalidationHelper 재사용?
3. 에러 응답 직접 생성 → AppError 재사용?
4. 새 enum 값 → 기존 switch/if-else 갱신?
5. 프론트엔드 API 호출 → 기존 *-api.ts 클라이언트 재사용?

## Exceptions
[위 Agents와 동일]

## 출력 형식
[동일 형식]
```

---

### Step 3: 결과 병합 → 리뷰 보고서

모든 Agent 스트림 완료 후, 결과를 통합 보고서로 병합합니다.

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

**중복 제거**: 여러 스트림에서 같은 파일에 대해 유사 이슈를 보고하면 병합합니다.

**심각도 조정**: 스트림 간 교차 영향(예: 백엔드 CAS 누락 + 프론트엔드 version 미전송)이면 개별 Warning → 통합 Critical로 승격할 수 있습니다.

### Step 4: 자체 학습

리뷰를 마친 후, 이번 리뷰에서 **이 스킬의 체크리스트나 예외를 개선할 학습**이 있었는지 점검합니다.

먼저 [references/review-learnings.md](references/review-learnings.md)를 읽어 기존 학습 기록을 확인합니다.

다음 4가지를 확인합니다:

**4a: 체크리스트에 없던 검사를 수행했는가?**

Step 2의 Agent 스트림이 체크리스트에 명시되지 않은 항목을 확인한 경우, `review-checklist.md` 해당 섹션에 추가하고 `review-learnings.md`에 기록합니다.

**4b: 사용자가 이슈를 의도된 설계로 확인했는가?**

사용자가 "이건 의도적이야" 등으로 응답한 이슈가 있으면, Exceptions 섹션에 추가하고 `review-learnings.md`에 기록합니다.

**4c: 반복 발견 안티패턴이 있는가?**

`review-learnings.md`에 이미 기록된 안티패턴이 다시 발견되면(2회 이상), `review-checklist.md`에 명시적 검사 항목으로 승격합니다. 처음 발견된 안티패턴은 `review-learnings.md`에만 기록합니다.

**승격된 항목은 learnings에서 `✅ 승격 완료` 마크로 상태를 갱신합니다.**

**4d: 아카이브 정리**

`review-learnings.md`의 1회 발견 항목이 **3개월 이상 재발견 없이 누적 20개를 초과**하면, 오래된 순서로 아카이브 섹션으로 이동합니다.

개선 사항이 있으면 보고서 하단에 한 줄로 표시합니다:

```markdown
> 이 리뷰를 통해 체크리스트 N개 항목, 예외 M개가 업데이트되었습니다.
```

## 스트림 실행 전략

### 변경 범위별 실행 패턴

| 변경 범위 | 실행 스트림 | Agent 수 |
|---|---|---|
| 백엔드만 | Backend | 1 |
| 프론트엔드만 | Frontend | 1 |
| 양쪽 (같은 도메인) | Backend + Frontend + Cross-cutting | 3 (병렬) |
| 양쪽 (다른 도메인) | Backend + Frontend | 2 (병렬) |

### Agent 실행 방법

Agent tool을 사용하되, `subagent_type`은 지정하지 않습니다 (general-purpose). 각 Agent에게:

1. 리뷰 대상 파일 목록을 명시적으로 전달
2. `references/review-checklist.md`의 해당 섹션 번호를 지정하여 읽도록 지시
3. `references/review-learnings.md`를 읽어 기존 학습 반영하도록 지시
4. Exceptions 목록을 인라인으로 포함하여 false positive 방지
5. 출력 형식을 통일하여 병합이 용이하도록 함

**중요**: Agent에게 "코드를 수정하지 말고 리뷰 결과만 보고하라"고 명시합니다.

## 심각도 기준

| 심각도 | 기준 | 예시 |
|---|---|---|
| **Critical** | 프로덕션 버그, 데이터 정합성, 보안 취약점 | CAS 누락으로 데이터 덮어쓰기 가능, userId body 신뢰 |
| **Warning** | 패턴 불일치, 캐시 누락, 성능 영향 | 교차 캐시 무효화 누락, 에러 코드 매핑 누락 |
| **Info** | 개선 제안, 일관성 향상 | 반환 타입 명시, 쿼리 빌더 패턴 통일 |

## 리뷰하지 않는 것

이 스킬은 다음을 **리뷰하지 않습니다** (verify-* 스킬 또는 lint가 담당):

- 코드 스타일, 포맷팅, 주석 (lint)
- SSOT import 소스 (verify-ssot). 단, **로직 수준 SSOT**는 Cross-cutting 스트림이 검사
- 값 수준 하드코딩 (verify-hardcoding). 단, **설계 수준 하드코딩**은 이 스킬이 판단
- Zod 검증 패턴 (verify-zod)
- Design Token 규칙 (verify-design-tokens)
- i18n 번역 일관성 (verify-i18n)

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
| [references/review-checklist.md](references/review-checklist.md) | 도메인별 상세 체크리스트 (8개 섹션) |
| [references/review-learnings.md](references/review-learnings.md) | 리뷰 학습 기록 (패턴, 예외, 안티패턴 축적) |
| `CLAUDE.md` | 프로젝트 전체 지침 |
| `.claude/skills/verify-implementation/SKILL.md` | 규칙 기반 통합 검증 (상호보완) |
| `apps/backend/src/common/base/versioned-base.service.ts` | CAS 기본 클래스 |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | 캐시 교차 무효화 |
| `apps/frontend/hooks/use-optimistic-mutation.ts` | 프론트엔드 CAS 처리 |
| `apps/frontend/lib/api/cache-invalidation.ts` | 프론트엔드 캐시 무효화 |
| `apps/frontend/lib/errors/equipment-errors.ts` | 에러 코드 매핑 |
