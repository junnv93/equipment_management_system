---
name: main 브랜치 직접 작업 기본
description: 브랜치 생성은 금지에 가깝다. CLAUDE.md 솔로 트렁크 기반 워크플로우에 맞게 main에서 직접 작업하고 푸시한다
type: feedback
originSessionId: 5826e374-4a9c-46c2-aabe-5945bd9dfe5c
---
기본 워크플로우는 **main 직접 작업 + 직접 push**. 브랜치 + PR은 예외 케이스.

**Why**: CLAUDE.md "Solo Trunk-Based" 원칙 명시 — "1인 프로젝트 — 기본은 main 직접 작업, 위험 작업만 브랜치 + PR". 사용자는 불필요한 브랜치 생성에 반복적으로 강한 거부감 표시:
- 2026-04-08: "브랜치좀 열지마 제발"
- 2026-04-12: ResultSectionsPanel 아키텍처 재정비(19 파일, Mode 2 harness) 에서도 "브랜치 열지말고 모두 메인에서 작업해" — **Mode 2 대규모 변경조차 main 선호**
작은/중간 변경을 브랜치로 분리하면 리뷰 오버헤드만 누적됨.

**How to apply**:
- 기본값: 수정 → `git add` → `git commit` → `git push` (main). pre-push가 tsc+test 자동 검증.
- 브랜치 생성은 **사실상 금지**. CLAUDE.md 의 예외 사례(DB 마이그레이션 / major dep bump / 50+ 파일 리팩토링 / 실험적 작업) 조차 사용자는 main 을 선호할 가능성이 높다 — 브랜치를 만들기 전 반드시 사용자에게 확인.
- Mode 2 harness 도 main 에서 진행 (변경 파일 수만으로 브랜치 결정 금지).
- 에러 수정, 리팩토링 수 파일, 기능 추가 수 파일 — 전부 main.
- 이미 브랜치를 열었고 사용자가 불만을 표할 경우: 즉시 `git checkout main` (uncommitted changes 유지) + `git branch -D <branch>` 로 돌아가고, 이후 작업은 main 에서 계속.
- 사용자가 명시적으로 "브랜치 만들어"라고 하지 않는 한 브랜치 제안조차 하지 않는다.
