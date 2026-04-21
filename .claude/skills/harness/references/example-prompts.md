# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-21 (QR Phase 1-3 후속 개선 섹션 완료 10건 전체 archive-domain.md 이동. 사용자 결정 대기 1건(커밋 귀속 오염 복구) → Option A 채택으로 폐기. 미완료 1건: sticky-header CSS 변수(트리거 조건 미달). UR-1/2/3 ultrareview 통합 프롬프트 추가 2026-04-21.)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용. `/playwright-e2e` 로 E2E 프롬프트 실행.

---

## UltraReview 통합 — Layer 6 머지 관문 프롬프트 (3종)

> **배경 (2026-04-21)**: CAS stale 4차 재발, 트랜잭션 경계 3차 재발 등 verify-*/review-architecture 단일 패스로 못 잡는
> 의미론적·동시성·재현 버그 대응. ultrareview(원격 multi-agent fleet)를 머지 직전 관문으로 통합.
> 상세: `docs/references/ultrareview-usage.md`

### 🟠 HIGH — UR-1: 머지 직전 ultrareview Go/No-Go 판정 + 실행 준비 (Mode 0)

```
목적: 브랜치 머지 직전 ultrareview 실행 여부를 자동 판정하고 실행을 준비한다.
      판정 기준은 SSOT 파생 (review-learnings.md 고위험 패턴 + CLAUDE.md 예외 항목).

단계:
1. Advisor 실행
   node scripts/ultrareview-advisor.mjs --json
   결과를 읽고 decision / reasons / costEstimate 필드 확인

2. 판정에 따른 분기
   [Go] → 3단계로 진행
   [No-Go] → 이유 제시 + /review 또는 해당 verify-* 스킬 실행 권고로 종료

3. (Go인 경우) Pre-upload secret gate
   node scripts/ultrareview-preflight.mjs
   - exit 0: 4단계 진행
   - exit 1: 오류 메시지에 따라 파일 제거 또는 .gitleaks.toml allowlist 추가 후 재실행

4. (Preflight 통과 시) 사용자에게 실행 명령 제시
   - PR 번호 확인: gh pr list --state open --author @me
   - 제시 명령: /ultrareview <PR번호>
   - 예상 시간: 5~10분 (백그라운드, /tasks 로 추적)
   - 실행은 사용자가 직접 확인 후 입력 (자동 실행 금지)

검증:
- decision / category / costEstimate / 실행 명령 4개 필드 모두 출력됨
- Go 판정이면 preflight exit 0 확인됨
- 명령 제시 후 대기 (실제 /ultrareview 실행은 사용자 몫)
```

### 🔴 CRITICAL — UR-2: ultrareview Finding 후속 수정 (Mode 1)

```
입력: ultrareview 완료 후 /tasks에서 확인한 finding 리포트 (file:line + 설명)

finding 분류 → verify-* 2차 검증 매핑 테이블:
  CAS / VERSION_CONFLICT    → verify-cas 스킬 실행
  권한 / RBAC / SiteScope   → verify-auth 스킬 실행
  이벤트 / 캐시 무효화       → verify-cache-events 스킬 실행
  Zod / validation          → verify-zod 스킬 실행
  트랜잭션 경계 / this.db    → review-architecture 스킬 실행
  기타 설계 이슈             → review-architecture 스킬 실행

finding별 처리:
  [true positive]
  1. 해당 verify-* 스킬 Skill 호출로 패턴 준수 확인
  2. CLAUDE.md Behavioral Guidelines "수술적 변경" 원칙으로 최소 fix
  3. tsc + 관련 spec 실행 → green 확인
  4. 변경 파일 수 ≤ finding 수 × 3 (spread 제한)
  5. review-learnings.md 해당 섹션에 재발 기록 append:
     형식: [YYYY-MM-DD] {패턴명} — {file:line} ({n}차 재발)
     3회 도달 시: manage-skills 스킬로 신규 verify-* 스킬 생성 제안

  [false positive]
  1. 왜 false positive인지 근거 1문장 작성
  2. review-learnings.md "추가된 예외" 섹션에 기록:
     형식: [YYYY-MM-DD] ultrareview FP — {패턴명}: {근거}

검증:
- pnpm --filter backend exec tsc --noEmit
- pnpm --filter frontend exec tsc --noEmit
- 관련 모듈 spec 통과
- review-learnings.md에 결과 append 확인
- 변경 파일 수 ≤ finding 수 × 3
```

### 🟡 MEDIUM — UR-3: 무료 Quota 소진 시 로컬 Fleet Review 대체 (Mode 2)

```
사용 조건: ultrareview 무료 3회 소진 AND 비용 지출 불가 상황
          (또는 브랜치 모드 불가 환경)

구조: Explore subagent 3개 단일 메시지 병렬 실행

Agent A — Backend race/원자성/트랜잭션 경계
  조사 대상: review-learnings.md "트랜잭션 내 서비스 메서드" + "CAS 선점" 섹션의 파일 경로
  확인 항목:
  - 변경된 service.ts 파일에서 db.transaction() 내부 this.db 직접 사용 패턴
  - CAS 선점 순서 (상태 전이 → 작업 순서 위반)
  - 보상 코드 누락 (CAS 선점 후 후속 실패 시 미복원)
  보고: file:line + 재현 조건 1줄

Agent B — Frontend stale closure/CAS/SSOT 경로
  조사 대상: review-learnings.md "Stale CAS 버전" 4차 재발 섹션 패턴
  확인 항목:
  - mutation.mutationFn 내부 useQuery 캐시 스냅샷(version) 직접 참조
  - 상태 전이 액션에서 fresh fetch 없이 캐시 버전 사용
  - VERSION_CONFLICT 핸들러(onError) 누락
  보고: file:line + stale 경로 설명

Agent C — Cross-module 이벤트·캐시·권한 흐름
  조사 대상: review-learnings.md "이벤트" + "권한/RBAC" + "캐시 무효화" 섹션
  확인 항목:
  - emitAsync vs emit 사용 일관성 (verify-cache-events 스킬 기준)
  - 신규 엔드포인트 @SiteScoped/@Permissions 누락
  - 장비 상태 전이 후 캐시 무효화 이벤트 미발행
  보고: file:line + 이슈 설명

제약:
  - 세션당 1회 한도 (중복 실행 금지, /tasks로 이미 실행 중인지 확인)
  - 각 agent 보고 400단어 이내
  - 독립 재현 검증 없음 → ultrareview 대비 false positive 가능성 높음
  - finding은 반드시 해당 verify-* 스킬 2차 검증 후 수정

검증:
  - 세 agent 결과 합산 → 중복 제거 → priority 랭킹
  - ultrareview와 동일하게 UR-2 파이프라인으로 처리
```


> **완료된 항목은 [example-prompts-archive.md](./example-prompts-archive.md)로 분리 (2026-04-09 36차 정리).**
> 현재 파일은 활성(미해결) harness 프롬프트만 포함. 새 프롬프트는 활성 영역에 추가.

---

## 34차 후속 — wf20-infra-debt harness 결과 review-architecture tech debt (3건)

> **발견 배경 (2026-04-08, wf20-infra-debt harness PASS 직후 review-architecture)**:
> SelfInspectionTab.tsx 행 액션 aria-label SSOT 패턴 도입 후, 동일 도메인의 다른 컴포넌트에서
> divergence가 확인되었다. wf20-infra-debt harness contract의 SHOULD criteria로 분류되었던
> 항목 + producer/consumer scope 정합성 검증 중 발견된 항목을 등재.

### 🟢 LOW — sticky-header CSS 변수명 string literal 중복 (3 곳, 4번째 등장 시 상수화)

```
배경: wf20-infra-debt harness review-architecture 검증 결과:
'--sticky-header-height' CSS 변수가 producer 1곳 + consumer 2곳에 string literal 로 중복 박혀 있다:
1. Producer: apps/frontend/components/equipment/EquipmentDetailClient.tsx:96
   document.documentElement.style.setProperty('--sticky-header-height', ...)
2. Consumer (CSS): apps/frontend/lib/design-tokens/components/equipment.ts:809
   top-[var(--sticky-header-height,0px)]
3. Consumer (e2e): apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts:34
   getComputedStyle(documentElement).getPropertyValue('--sticky-header-height')

세 지점 모두 :root 스코프로 통일되어 silent 0 반환 리스크는 없으나, 4번째 consumer (예: 다른
sticky tab 컨테이너) 가 등장할 때 오타/스코프 불일치 가능성이 있다.

작업 (4번째 consumer 등장 시점에만 진행 — 현재는 over-engineering):
1. apps/frontend/lib/design-tokens/primitives/ 또는 shared-constants 에
   STICKY_HEADER_HEIGHT_VAR = '--sticky-header-height' 상수 추가
2. 3 곳 모두 import 로 교체
3. /verify-hardcoding 룰: CSS 변수명 string literal 2회+ 사용 시 상수화 권고 추가 (선택)

검증:
- pnpm tsc --noEmit exit 0
- grep "'--sticky-header-height'" apps/frontend → import 외 0 hit

⚠️ 현재는 트리거 조건 미달 (3 hit). 4번째 hit 발생 시 자동 승격.
```

