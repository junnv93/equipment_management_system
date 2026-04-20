# Contract: cleanup-0421

## MUST Criteria (배포 차단 — 하나라도 실패 시 reject)

### 공통
- [ ] `pnpm tsc --noEmit` 통과 (backend + frontend)
- [ ] `pnpm --filter backend run test` 통과 (기존 단위 테스트 그린 유지)
- [ ] `pnpm --filter frontend run lint` 통과
- [ ] 신규 `any` 0건, 신규 `eslint-disable` 0건
- [ ] 모든 변경 파일에서 SSOT 우회 0건 (URL/role/permission 리터럴 신규 도입 금지)
- [ ] `git diff`상 요청 범위 외 파일 변경 0건 (수술적 변경 원칙)

### Phase 1 — renderer 주석 정리
- [ ] `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`에 **코드 라인 변경 0** (주석 라인만 변경)
- [ ] 도메인 출처 인용 (UL-QP-19-01 §4) 주석 보존
- [ ] hidden invariant 설명 주석 보존 (extraRows/spliceRows, formatSlashDate null 폴백, formatDotDate 타임존)
- [ ] 코드를 그대로 풀어 쓰는 WHAT 주석 (예: "Row 1 제목 업데이트") 제거
- [ ] 신규 주석 추가 0건

### Phase 2 — NC close 구조화 로그
- [ ] `non-conformances.service.ts` `close()`에 `logger.log()` info-level 1건 추가
- [ ] 로그 페이로드 필드: `message`, `ncId`, `equipmentId`, `closedBy`, `equipmentStatusRestored`, `previousEquipmentStatus` (모두 포함)
- [ ] 기존 `logger.debug({...})` (805~811행) 보존 — 제거하지 않음
- [ ] 추가 위치: `await this.eventEmitter.emitAsync(NC_CLOSED, ...)` 직후, `return result.updated` 직전
- [ ] 신규 import 0건 (Logger 이미 import됨)
- [ ] `close()` 외 메서드는 변경 없음

### Phase 3 — E2E globalPrefix 통합
- [ ] 다음 3개 파일에서 `localhost:3001` 하드코딩 제거 후 `BASE_URLS.BACKEND` 경유:
  - `apps/frontend/tests/e2e/features/handover/phase3-handover.spec.ts`
  - `apps/frontend/tests/e2e/scripts/generate-real-inspection-docx.ts`
  - `apps/frontend/tests/e2e/scripts/generate-inspection-docx.ts`
- [ ] `BASE_URLS` SSOT 파일(`shared-test-data.ts`)은 변경 없음
- [ ] `.md`/주석 내 URL 언급은 변경 없음 (실행 코드만 정리)
- [ ] 변수명(`BACKEND_URL`, `BACKEND`) 기존 명명 유지
- [ ] 검증 grep — 실행 코드 라인에서 `localhost:3001` 잔여 0건:
  ```
  grep -rn "localhost:3001" apps/frontend/tests/e2e --include="*.ts" \
    | grep -v "shared-test-data.ts" \
    | grep -vE "^[^:]+:[0-9]+:\s*(\*|//|/\*)"
  ```
  결과는 빈 출력 또는 시드/식별번호 라인만

### Phase 4 — ValidationDetailContent 분리
- [ ] `_components/` 디렉터리에 sub-component 파일 6개 생성:
  - `ValidationBasicInfoCard.tsx`
  - `ValidationVendorInfoCard.tsx`
  - `ValidationSelfTestInfoCard.tsx`
  - `ValidationApprovalInfoCard.tsx`
  - `ValidationDocumentsSection.tsx`
  - `ValidationEditDialog.tsx`
- [ ] 부모 `ValidationDetailContent.tsx` 라인 수 ≤ 250 (목표 150~200)
- [ ] 부모는 데이터 fetch (`useQuery(softwareValidations.detail)`) + isLoading/not-found + 헤더 + isEditOpen URL sync + 분기 렌더 책임 유지
- [ ] sub-component 모두 `'use client'` directive 보유 (React Hook 사용)
- [ ] 기존 동작 회귀 0건:
  - 다이얼로그 open 상태가 URL `?edit=true`와 양방향 동기화
  - `isVendor`/`isSelf` 분기 렌더 동일
  - 업로드/다운로드/삭제 동선 동일
  - CAS update mutation 동일 (`useCasGuardedMutation` 그대로)
  - ExportFormButton의 `disabled={!isValidationExportable(...)}` 보존
  - aria-label (다운로드/삭제 버튼) 보존
- [ ] 신규 커스텀 훅 추출 0건
- [ ] 신규 Context provider 0건

## SHOULD Criteria (품질 — 가능한 한 충족)

### 공통
- [ ] 변경된 파일이 prettier-clean (PostToolUse hook이 자동 적용)
- [ ] 커밋 단위 분할 가능 (Phase 1~4 각각 독립 커밋 권장 — Generator 자유)

### Phase 1
- [ ] WHAT 주석 → WHY 주석으로 단어 한두 개 보강하여 승격하는 케이스가 있다면 도메인 맥락(템플릿 보존, UL-QP-19-01) 표현 우선

### Phase 2
- [ ] info-level 로그가 `[NonConformancesService]` 네임스페이스로 출력되어 grep 가능
- [ ] 로그 페이로드 키 순서가 기존 debug(`805~811행`)와 일관성 있음 (가독성)

### Phase 3
- [ ] 새 import 라인이 파일 내 기존 import 그룹과 일관된 위치에 배치
- [ ] 스크립트 파일(`generate-*.ts`)의 BASE_URLS import 경로가 `tests/e2e/shared/constants/shared-test-data` 직접 경유 (상대경로 정확)

### Phase 4
- [ ] sub-component 각 파일 ≤ 150줄
- [ ] sub-component prop interface 명시적 (props 인라인 타입보다 `interface ...Props`)
- [ ] `_components/index.ts` barrel은 가독성에 도움될 때만 추가 (강제 X)
- [ ] sub-component 안에서 부모 SearchParams/Router에 직접 의존하지 않음 (open/onOpenChange 콜백으로 격리)
- [ ] `ValidationDocumentsSection`은 자체 useQuery + invalidate를 가지므로 부모로부터 documents 데이터를 prop으로 받지 않음

## OUT-OF-SCOPE (이번 작업에서 하지 않음)

- API path 자체의 `API_ENDPOINTS` SSOT 마이그레이션 (Phase 3 범위 외)
- ValidationDetailContent의 디자인/UX/SSOT/i18n 키 일제 정비 (review-architecture 이연)
- 다른 NC 메서드(update, rejectCorrection 등)에 동일 로그 패턴 적용
- renderer service 코드 로직 개선
- `shared-test-data.ts` BASE_URLS 자체의 환경변수 fallback 변경
- 테스트 신규 작성 (기존 그린 유지만 확인)
