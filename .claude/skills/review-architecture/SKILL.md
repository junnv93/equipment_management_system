---
name: review-architecture
description: Architecture-level code review — traces changes across DB→Service→Controller→DTO→Hook→Component→Cache layers, verifying cross-module pattern consistency, CAS coherence, cache invalidation correctness, security layers, and performance anti-patterns. Unlike verify-* skills (rule-based automated checks), this provides senior architect-level design judgment. Use after adding new modules, implementing complex state-change logic, multi-step approval flows, or modifying cache strategies. Trigger on: "아키텍처 리뷰", "코드 리뷰", "전체 리뷰", "PR 리뷰", "리뷰해줘", "review changes", "check architecture", "code review", "PR review", "structural review".
argument-hint: '[선택사항: 특정 도메인명 또는 파일 경로]'
---

# 아키텍처 레벨 코드 리뷰

## Purpose

이 스킬은 **verify-* 스킬과 상호보완적**입니다:

- **verify-* 스킬**: Grep 패턴 매칭으로 규칙 위반을 자동 탐지 (정답이 명확한 검사)
- **이 스킬**: 시니어 아키텍트 관점에서 계층 간 일관성, 설계 판단, 성능 영향을 리뷰

### 핵심 철학

- **SSOT 사고**: 새 코드가 기존 유틸리티/헬퍼/패턴을 재사용하는가?
- **하드코딩 방지**: 설계 결정의 하드코딩(if-else 체인, 매직 넘버 비즈니스 규칙 등)
- **성능 전략**: 데이터 증가에 따른 확장성과 캐시 전략 적절성

## Workflow

### Step 1: 변경 범위 파악

인수가 제공되면 해당 도메인/파일만, 아니면 `git diff --name-only HEAD` + `git status --short`로 식별.

변경 파일을 **3개 스트림**으로 분류:

| 스트림 | 대상 파일 패턴 | 리뷰 영역 |
|---|---|---|
| **Backend** | `modules/*/`, `common/`, `database/`, `packages/db/` | CAS, 캐시, 보안, 성능 |
| **Frontend** | `app/`, `components/`, `hooks/`, `lib/` | 상태 아키텍처, 캐시 무효화, 에러 전파 |
| **Cross-cutting** | 양쪽 모두 변경된 도메인 | 계층 관통, 모듈 패턴 일관성 |

### Step 2: 병렬 리뷰 실행

변경이 존재하는 스트림만 Agent tool로 동시 실행합니다.

상세 Agent 프롬프트 템플릿: [references/review-agent-prompts.md](references/review-agent-prompts.md)

### Step 3: 결과 병합 → 리뷰 보고서

모든 Agent 스트림 완료 후, 통합 보고서로 병합합니다.

```markdown
## 아키텍처 리뷰 보고서

### 요약
| 영역 | 상태 | 발견 사항 |
|---|---|---|
| 계층 관통 | OK / N개 누락 | 요약 |
| CAS 일관성 | OK / N개 이슈 | 요약 |
| 캐시 코히어런스 | OK / N개 이슈 | 요약 |
| ...

### 발견된 이슈 (심각도순)
#### [Critical|Warning|Info] 제목
- **파일**: `path:line`
- **문제/영향/수정안/참고 패턴**
```

### Step 4: 자체 학습

리뷰 후 체크리스트/예외 개선 학습을 점검합니다.

상세: [references/review-agent-prompts.md](references/review-agent-prompts.md) Step 4

## 심각도 기준

| 심각도 | 기준 | 예시 |
|---|---|---|
| **Critical** | 프로덕션 버그, 데이터 정합성, 보안 취약점 | CAS 누락, userId body 신뢰 |
| **Warning** | 패턴 불일치, 캐시 누락, 성능 영향 | 교차 캐시 무효화 누락 |
| **Info** | 개선 제안, 일관성 향상 | 반환 타입 명시 |

## 리뷰하지 않는 것

- 코드 스타일, 포맷팅, 주석 (lint)
- SSOT import 소스 (verify-ssot)
- 값 수준 하드코딩 (verify-hardcoding)
- Zod 검증 패턴 (verify-zod)
- Design Token 규칙 (verify-design-tokens)
- i18n 번역 일관성 (verify-i18n)

## Exceptions

다음은 **이슈로 보고하지 않습니다**:

1. **CalibrationPlans의 casVersion 사용** — 의도적 설계 (계획서 개정 이력 vs CAS)
2. **컨트롤러의 중복 `@UseGuards(JwtAuthGuard)`** — 방어적 코딩으로 허용
3. **단순 모듈의 인라인 쿼리 조건** — 쿼리 복잡도가 낮은 경우 허용
4. **프론트엔드 UI 표시용 로컬 상수** — STATUS_LABELS 등 UI 전용
5. **테스트 파일의 패턴 차이** — 프로덕션 코드와 다른 패턴 허용
6. **`proxy.ts` 파일명 + `proxy` 함수명** — Next.js 16.1.6 정상 패턴

## Related Files

| File | Purpose |
|---|---|
| [references/review-checklist.md](references/review-checklist.md) | 도메인별 상세 체크리스트 (8개 섹션) |
| [references/review-learnings.md](references/review-learnings.md) | 리뷰 학습 기록 |
| [references/review-agent-prompts.md](references/review-agent-prompts.md) | Agent 프롬프트 템플릿 + 자체 학습 절차 |
| `apps/backend/src/common/base/versioned-base.service.ts` | CAS 기본 클래스 |
| `apps/backend/src/common/cache/cache-invalidation.helper.ts` | 캐시 교차 무효화 |
| `apps/frontend/hooks/use-optimistic-mutation.ts` | 프론트엔드 CAS 처리 |
| `apps/frontend/lib/api/cache-invalidation.ts` | 프론트엔드 캐시 무효화 |
| `apps/frontend/lib/errors/equipment-errors.ts` | 에러 코드 매핑 |
