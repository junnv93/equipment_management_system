---
name: NestJS 정적 라우트는 파라미터 라우트보다 먼저 선언
description: /:sectionId 와 /reorder 같은 정적/파라미터 혼재 라우트는 선언 순서가 ParseUUIDPipe 동작을 좌우한다
type: feedback
originSessionId: ed411413-c8e7-4f9c-b01e-7360d276e36b
---
정적 서브 경로(`/reorder`, `/upload-csv`, `/bulk` 등)는 반드시 파라미터 경로(`/:sectionId`) **앞에** 선언해야 한다.

**Why**: NestJS 의 Express 어댑터는 데코레이터 선언 순서대로 라우트를 등록한다. 역순이면 `/:sectionId` 가 먼저 매칭되어 `"reorder"` 가 `ParseUUIDPipe` 로 들어가 즉시 400 Bad Request 를 반환하고, 정적 핸들러는 영원히 도달 불가능해진다. 2026-04-12 ResultSectionsPanel harness 에서 Batch A reorder 엔드포인트가 이 실수로 런타임에서 완전 무력화되었고 evaluator 가 이를 잡아냈다 (1차 시도 FAIL).

**How to apply**:
- 컨트롤러에 `/reorder`, `/bulk`, `/swap`, `/search`, `/counts`, `/stream` 같은 정적 sub-path 를 추가할 때: 기존 `/:id` 또는 `/:sectionId` 블록 **앞**에 삽입.
- 기존 파일 순서가 이미 역순이면 즉시 이동 + 주석으로 경고(`⚠️ 라우트 순서 주의: /reorder 는 반드시 /:sectionId 앞에 선언해야 한다`).
- code-review / harness evaluator 가 반드시 체크해야 하는 항목 — 정적 경로 추가 PR 마다 grep 으로 순서 검증.
