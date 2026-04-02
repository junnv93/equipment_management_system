# Harness 실전 프롬프트 — 코드베이스 실제 이슈 기반

> **마지막 정리일: 2026-04-02 (6차 정리 — PendingChecks 기능 완성)**
> 코드베이스를 실제 분석 → 2차 검증 완료된 이슈만 수록.
> `/harness [프롬프트]` 형태로 사용.

---

## 🟠 HIGH (성능)

### CI unit-test Turbo 캐시 미적용 (Mode 0)

```
CI main.yml의 unit-test job에 Turbo 캐시가 없어서 공유 패키지를 매번 재빌드해.

위치: .github/workflows/main.yml:132-153
문제: quality-gate job은 turbo cache (line 59-66) 사용하지만,
      unit-test job (line 142-150)은 node-modules-cache만 있고 turbo cache 없음

수정: unit-test steps에 quality-gate와 동일한 turbo cache step 추가
검증: GitHub Actions에서 unit-test job의 Build 단계 시간 비교 (기대: ~15s → ~3s)
```

---

## 🟡 MEDIUM (품질/DX)

### AlertsContent activeTab URL SSOT 위반 (Mode 0)

```
알림 페이지의 activeTab이 useState로 관리되어 URL과 동기화되지 않아.
URL 공유/새로고침 시 탭 상태 유실됨.

위치: apps/frontend/app/(dashboard)/alerts/AlertsContent.tsx:102
현재: const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')

수정: searchParams에서 tab 파라미터 읽기/쓰기 패턴으로 변경
참조: components/approvals/ApprovalsClient.tsx의 URL 탭 패턴
검증: 1) 탭 전환 후 새로고침 -> 탭 유지  2) tsc --noEmit
```

### softwareType TODO 해소 (Mode 1)

```
소프트웨어 장비별 조회 응답에서 softwareType이 항상 null 반환.

위치: apps/backend/src/modules/software/software.service.ts:460
현재: softwareType: null, // TODO: Add software type to schema
검증: GET /api/software/:id/equipment 응답에 softwareType 포함 확인
```

### userPreferences relations() 미정의 (Mode 0)

```
userPreferences 테이블에 Drizzle relations() 정의가 없어.

위치: packages/db/src/schema/user-preferences.ts
수정: userPreferencesRelations 추가 (userId -> users.id 관계)
검증: pnpm --filter @equipment-management/db run build
```

---

## 🟢 LOW (접근성/정리)

### NCDetailClient 뒤로가기 버튼 aria-label (Mode 0)

```
부적합 상세 페이지의 뒤로가기 아이콘 버튼에 aria-label이 없어.

위치: apps/frontend/components/non-conformances/NCDetailClient.tsx:281
수정: aria-label={t('detail.backButton')} 추가 + i18n 키 등록
```

### i18n Phase 3 유틸리티 TODO (Mode 1)

```
response-transformers.ts의 HTTP 에러 메시지가 아직 i18n 키로 전환되지 않았어.

위치: apps/frontend/lib/api/utils/response-transformers.ts:334
수정: 호출자 컴포넌트에서 errorCode 기반 i18n 메시지 표시 패턴 적용
검증: tsc --noEmit + 에러 발생 시 한국어 메시지 확인
```

---

## 📦 완료 항목 아카이브

<details>
<summary>완료된 항목 (25건)</summary>

### HIGH
- checkoutItems FK onDelete restrict 추가 (2026-04-02)
- monitoring execFile 전환 (2026-04-02)
- 프론트엔드 하드코딩 한국어 i18n 전환 — commit d6c8c0cd
- Equipment approvalStatus 인덱스 추가 — commit d6c8c0cd

### MEDIUM
- PendingChecks 기능 완성 — 백엔드 API + 필터 URL SSOT + 반출입 헤더 배지 버튼 (2026-04-02)
- 미사용 Permission enum 5건 정리 — PR #92
- CI pnpm install 캐시 최적화 — PR #92
- FK ON DELETE 정책 cascade->restrict 통일 — PR #92
- 부적합 수리 워크플로우 E2E FIXME 해소 — commit 3f93f3e3

### LOW
- 교정 필터 E2E 테스트 — PR #85에서 중복 삭제
- i18n 에러 메시지 Phase 3 구현 — PR #85
- 폐기 취소 확인 다이얼로그 — commit d6c8c0cd

### 복합
- 모니터링 대시보드 프론트엔드 — PR #88
- 테스트 커버리지 확대 — PR #96

### 이전 세션
- SSE 엔드포인트 권한 강화, 부적합 관리 권한 버그(PR #79),
  모니터링 cache-stats(PR #77), softwareType 스키마(PR #82),
  누락 loading.tsx, DB 인덱스, 미커밋 테스트, documents relations,
  E2E CI auth.setup(PR #83), CodeQL(PR #74)

</details>

<details>
<summary>거짓 양성 (8건)</summary>

- 교정계획 @AuditLog 누락 — 전부 적용됨
- auth.service.ts 빈 catch — 의도적 fail-open
- 누락된 error.tsx — 부모 cascading boundary 커버
- @AuditLog decorator 순서 — 기능 무관
- error.tsx/loading.tsx 26건 — 실제 존재
- Turbo cache key — 내부 해싱이 감지
- system-settings 인덱스 — 소규모 테이블
- preferences @AuditLog — 비즈니스 감사 대상 아님

</details>
