# Review Learnings

리뷰를 통해 축적된 학습 기록입니다. 새로운 패턴, 예외, 안티패턴 발견 시 자동으로 업데이트됩니다.

## Table of Contents

1. [발견된 패턴](#발견된-패턴)
2. [추가된 예외](#추가된-예외)
3. [발견된 안티패턴](#발견된-안티패턴)
4. [업데이트 이력](#업데이트-이력)

---

## 발견된 패턴

리뷰 과정에서 발견된 프로젝트 고유 패턴으로, 체크리스트에 반영된 것들입니다.

<!-- 형식:
### [날짜] 패턴 이름
- **발견 위치**: `file:line`
- **설명**: 패턴 설명
- **체크리스트 반영**: review-checklist.md 섹션 N에 추가됨
-->

### [2026-03-21] Zod v4 UUID SSOT 유틸리티 (`uuidString`)
- **발견 위치**: `packages/schemas/src/utils/fields.ts`
- **설명**: Zod v4의 `z.string().uuid()`는 RFC 9562 버전/변형 니블을 엄격 검증하여 개발 시드 UUID(`00000000-0000-0000-0000-000000000002`)를 거부. `uuidString()` SSOT 유틸리티를 생성하고 프로젝트 전체(schemas 10파일 + backend DTO 16파일 + frontend 1파일)를 마이그레이션.
- **체크리스트 반영**: review-checklist.md 섹션 6에 "UUID 검증 SSOT" 항목 추가 필요

### [2026-03-21] 모듈 로드 시점 SSOT 교차 검증 패턴
- **발견 위치**: `apps/backend/src/modules/notifications/events/notification-events.ts:113-122`
- **설명**: SSOT enum 배열(`NOTIFICATION_TYPE_VALUES`)과 런타임 변환 결과(`EVENT_TO_NOTIFICATION_TYPE`)의 정합성을 모듈 로드 시점에 `for..of` 루프로 교차 검증. 불일치 시 서버 시작 에러 발생 → CI에서 사전 탐지. 단순 변환 함수보다 견고한 SSOT 보장 패턴.
- **체크리스트 반영**: review-checklist.md 섹션 1 "계층 관통 추적"에 "enum↔변환 교차 검증" 항목 추가 고려

---

## 추가된 예외

리뷰에서 처음에 이슈로 탐지되었으나, 의도된 설계임이 확인되어 예외로 등록된 케이스입니다.

<!-- 형식:
### [날짜] 예외 이름
- **최초 탐지**: 어떤 Step에서 무엇이 경고되었는지
- **예외 사유**: 왜 이것이 위반이 아닌지
- **SKILL.md 반영**: Exceptions 섹션에 추가됨
-->

(아직 기록 없음)

---

## 발견된 안티패턴

리뷰에서 반복적으로 발견되어 체크리스트에 명시적으로 추가된 안티패턴입니다.

<!-- 형식:
### [날짜] 안티패턴 이름
- **발견 빈도**: N회 (도메인: xxx, yyy)
- **설명**: 구체적 안티패턴
- **체크리스트 반영**: review-checklist.md 섹션 N에 추가됨
-->

### [2026-03-21] Zod v4 `z.string().uuid()` 직접 사용
- **발견 빈도**: 1회 (frontend: IncidentHistoryTab.tsx) — 마이그레이션 누락
- **설명**: `z.string().uuid()` 직접 호출은 Zod v4에서 시드 UUID를 거부함. 반드시 `uuidString()` SSOT 유틸리티 사용 필요.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md에 명시적 항목으로 승격

### [2026-03-21] SSOT enum↔변환 불일치 (런타임 미탐지)
- **발견 빈도**: 1회 (notifications: eventName→type camelCase 불일치)
- **설명**: 이벤트명→DB type 변환 결과가 SSOT enum에 없어도 런타임 에러가 발생하지 않던 문제. 배치 삽입이 Zod 검증을 우회하므로 불일치가 DB에 잘못된 값으로 저장됨. 모듈 로드 시점 교차 검증으로 해결.
- **체크리스트 반영**: 추후 2회 이상 발견 시 review-checklist.md에 명시적 항목으로 승격

---

## 업데이트 이력

| 날짜 | 유형 | 설명 | 반영 파일 |
|---|---|---|---|
| (초기화) | - | 학습 기록 시스템 초기화 | review-learnings.md |
| 2026-03-21 | 새 패턴 | Zod v4 UUID SSOT `uuidString()` 마이그레이션 | review-learnings.md |
| 2026-03-21 | 안티패턴 | `z.string().uuid()` 직접 사용 → 시드 UUID 실패 | review-learnings.md |
| 2026-03-21 | 새 패턴 | 모듈 로드 시점 SSOT 교차 검증 (enum↔변환 결과) | review-learnings.md |
| 2026-03-21 | 안티패턴 | SSOT enum↔변환 불일치 런타임 미탐지 | review-learnings.md |
