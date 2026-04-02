# 아키텍처 리뷰 Agent 프롬프트 템플릿

## Stream A: Backend Review Agent

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

## Stream B: Frontend Review Agent

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

## Stream C: Cross-cutting Review Agent

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

## Step 4: 자체 학습

리뷰를 마친 후, 이번 리뷰에서 **이 스킬의 체크리스트나 예외를 개선할 학습**이 있었는지 점검합니다.

먼저 [references/review-learnings.md](references/review-learnings.md)를 읽어 기존 학습 기록을 확인합니다.

다음 4가지를 확인합니다:

**4a: 체크리스트에 없던 검사를 수행했는가?**

Step 2의 Agent 스트림이 체크리스트에 명시되지 않은 항목을 확인한 경우, `review-checklist.md` 해당 섹션에 추가하고 `review-learnings.md`에 기록합니다.

**4b: 사용자가 이슈를 의도된 설계로 확인했는가?**

사용자가 "이건 의도적이야" 등으로 응답한 이슈가 있으면, **3곳을 동시에 갱신**합니다:
1. SKILL.md의 Exceptions 섹션에 추가
2. 각 Agent 프롬프트 템플릿의 인라인 Exceptions에도 추가 (동기화 필수)
3. `review-learnings.md`의 "추가된 예외" 섹션에 기록

**4c: 반복 발견 안티패턴이 있는가?**

`review-learnings.md`에 이미 기록된 안티패턴이 다시 발견되면(2회 이상), `review-checklist.md`에 명시적 검사 항목으로 승격합니다. 처음 발견된 안티패턴은 `review-learnings.md`에만 기록합니다.

**상태 표기 통일** — learnings의 각 항목에 다음 3가지 상태만 사용합니다:
- `관찰 중 (N회)` — 아직 승격 기준(2회) 미달
- `승격 완료` — checklist에 반영됨
- `아카이브` — 3개월 이상 미재발로 아카이브됨

**4d: 아카이브 정리**

`review-learnings.md`의 `관찰 중` 항목이 **3개월 이상 재발견 없이 누적 20개를 초과**하면, 오래된 순서로 아카이브 섹션으로 이동합니다.

**이 Step은 필수입니다.** 보고서의 "자체 학습" 섹션에 결과를 기록합니다. 업데이트가 없더라도 "새로운 학습 없음"이라고 명시합니다.
