# 부적합 승인 카운트 시스템 개선 (2026-02-15)

## 🔍 문제 상황

**증상**: 승인관리 페이지에서 "부적합 재개" 탭에 뱃지 카운트 1개 표시되지만, 실제로 승인 대기 목록이 없음

**사용자 보고**: Suwon 사이트 기술책임자가 로그인했을 때 다른 사이트(Uiwang)의 부적합까지 카운트에 포함됨

## 🎯 근본 원인 (Root Cause Analysis)

### 1. 크로스 사이트 워크플로우 미지원

- **Backend**: `ApprovalsService.getNonConformanceCount()`가 **팀 필터링 없이** 모든 `corrected` 상태 부적합을 카운트
- **결과**: Suwon 팀 기술책임자가 Uiwang 팀 부적합(NC_009)까지 볼 수 있음
- **데이터**: NC_009는 Uiwang General RF 팀 소속 장비 (`eeee5001-0001-4001-8001-000000000001`)

### 2. 시드 데이터 명확성 부족

- `corrected` 상태 부적합 4건 존재 (NC_006, NC_007, NC_008, NC_009)
- 주석에 "승인 대기 중"이라는 명확한 표시 없음
- 크로스 사이트 테스트 데이터(NC_009) 표시 없음

### 3. SSOT 준수 확인 완료 ✅

- `closeNonConformance()` 로직은 정확함: `corrected` → `closed` 상태 전이 보장
- CAS(Optimistic Locking) 패턴 적용됨
- 캐시 무효화 정상 동작

## 🛠️ 해결 방안 (System Architecture Level)

### Phase 1: Backend 팀 필터링 추가 (Cross-Site Workflow)

**파일**: `apps/backend/src/modules/approvals/approvals.service.ts`

**변경사항**:

```typescript
// Before: 팀 필터링 없음
private async getNonConformanceCount(): Promise<number> {
  const items = await this.db.query.nonConformances.findMany({
    where: (nc, { eq, and, isNull }) =>
      and(eq(nc.status, 'corrected'), isNull(nc.deletedAt)),
    // ...
  });
  return validItems.length;
}

// After: 팀 필터링 적용 (lab_manager는 전체 조회)
private async getNonConformanceCount(
  userTeamId?: string | null,
  isLabManager?: boolean
): Promise<number> {
  const items = await this.db.query.nonConformances.findMany({
    // ... same query
    with: {
      equipment: {
        columns: { teamId: true },
      },
    },
  });

  // Team filtering (cross-site workflow consideration)
  if (!isLabManager && userTeamId) {
    validItems = validItems.filter(
      (item) => item.equipment?.teamId === userTeamId
    );
  }

  return validItems.length;
}
```

**효과**:

- ✅ technical_manager: **자기 팀 부적합만** 카운트에 포함
- ✅ lab_manager: **모든 사이트 부적합** 조회 가능 (크로스 사이트 감독)
- ✅ SSOT 유지: 팀 필터링 로직은 `equipment.teamId` JOIN으로 중앙화

### Phase 2: 시드 데이터 명확성 향상

**파일**: `apps/backend/src/database/seed-data/operations/non-conformances.seed.ts`

**변경사항**:

- `corrected` 상태 레코드에 `⚠️ PENDING APPROVAL` 주석 추가
- NC_009에 `🌐 CROSS-SITE` 태그 추가하여 크로스 사이트 테스트 데이터임을 명시

**주석 예시**:

```typescript
// Corrected + Replacement (조치 완료, 승인 대기 중 - Uiwang 사이트)
// ⚠️ PENDING APPROVAL: corrected 상태 = 기술책임자 승인 대기
// 🌐 CROSS-SITE: Uiwang General RF 팀 소속 장비 (크로스 사이트 워크플로우 테스트용)
createNC(NC_009_ID, EQUIP_RECEIVER_UIW_W_ID, daysAgo(18), 'damage', '수신기 RF 앰프 손상', 'corrected', { ... })
```

## 📊 검증 결과

### TypeScript 타입 체크

```bash
$ pnpm exec tsc --noEmit --project apps/backend/tsconfig.json
✅ 통과 (에러 없음)
```

### Backend 빌드

```bash
$ pnpm --filter backend run build
✅ 성공
```

### 예상 동작

- **Suwon FCC EMC/RF 기술책임자 로그인**:

  - Before: 부적합 재개 카운트 = 1 (NC_009 Uiwang 포함)
  - **After: 부적합 재개 카운트 = 0** (NC_009 Uiwang 제외)

- **Uiwang General RF 기술책임자 로그인**:

  - Before: 부적합 재개 카운트 = 1 (NC_009 포함)
  - **After: 부적합 재개 카운트 = 1** (NC_009 포함, 자기 팀)

- **Lab Manager 로그인**:
  - Before: 부적합 재개 카운트 = 1
  - **After: 부적합 재개 카운트 = 4** (모든 사이트 `corrected` 상태, NC_006/007/008/009)

## 🏗️ 아키텍처 설계 원칙 (SSOT & Cross-Site)

### 1. 팀 필터링 SSOT

- **단일 소스**: `equipment.teamId` JOIN
- **중앙화된 로직**: `getNonConformanceCount()` 내부에서 팀 필터링
- **역할 기반 가시성**:
  - `technical_manager`: 팀 단위 필터링 (사이트 내 팀 격리)
  - `lab_manager`: 전체 조회 (크로스 사이트 감독)

### 2. 상태 전이 State Machine (검증 완료 ✅)

```
open → analyzing → corrected → closed
                       ↑          ↓
                       └──────────┘
                     (rejection flow)
```

- **`corrected` 상태**: 기술책임자 승인 대기 (업무 규칙)
- **`closed` 상태**: 승인 완료, 장비 상태 복원 (`available`)
- **CAS 보장**: `version` 필드로 동시성 제어

### 3. 크로스 사이트 워크플로우

- **데이터 격리**: 팀 단위 필터링으로 기본 격리
- **감독자 접근**: lab_manager는 모든 사이트 조회 (품질 감독)
- **테스트 데이터**: 크로스 사이트 시나리오 검증용 시드 데이터 명시 (NC_009)

## 🚀 배포 체크리스트

- [x] Backend 팀 필터링 로직 추가
- [x] TypeScript 타입 체크 통과
- [x] Backend 빌드 성공
- [x] 시드 데이터 주석 개선
- [ ] Backend 서버 재시작
- [ ] Frontend 브라우저에서 승인 관리 페이지 카운트 확인
  - [ ] Suwon 기술책임자: 부적합 재개 = 0
  - [ ] Uiwang 기술책임자: 부적합 재개 = 1
  - [ ] Lab Manager: 부적합 재개 = 4
- [ ] E2E 테스트 (승인 워크플로우) 실행

## 📝 추가 권장사항

### 1. Frontend 카운트 쿼리 재검증

**파일**: `apps/frontend/lib/api/approvals-api.ts` (라인 449-469)

현재 `getPendingNonConformities()`는 클라이언트 사이드에서 필터링하지만, **Backend가 이미 팀 필터링을 적용**하므로 중복 필터링 제거 가능.

### 2. DB 마이그레이션 (선택사항)

현재 시드 데이터의 `corrected` 상태 부적합을 `closed`로 변경하려면:

```sql
-- Suwon 사이트 부적합 종료 (NC_006, NC_007, NC_008)
UPDATE non_conformances
SET status = 'closed',
    closed_by = '00000000-0000-0000-0000-000000000002', -- 기술책임자 Suwon
    closed_at = NOW(),
    closure_notes = '시드 데이터 정리: 승인 완료 처리'
WHERE id IN (
  'aaaa0006-0006-0006-0006-000000000006',
  'aaaa0007-0007-0007-0007-000000000007',
  'aaaa0008-0008-0008-0008-000000000008'
);

-- NC_009는 크로스 사이트 테스트용으로 corrected 상태 유지
```

**단, E2E 테스트가 `corrected` 상태 데이터에 의존할 수 있으므로 테스트 확인 후 실행**

## 🔗 관련 파일

### Backend

- `apps/backend/src/modules/approvals/approvals.service.ts` (팀 필터링 추가)
- `apps/backend/src/modules/non-conformances/non-conformances.service.ts` (상태 전이 로직)
- `apps/backend/src/database/seed-data/operations/non-conformances.seed.ts` (시드 데이터 주석)

### Frontend (검증 대상)

- `apps/frontend/components/dashboard/PendingApprovalCard.tsx` (대시보드 카운트 표시)
- `apps/frontend/lib/api/approvals-api.ts` (`getPendingNonConformities()` 클라이언트 필터링)

### 문서

- `CLAUDE.md` (프로젝트 가이드)
- `.claude/projects/.../memory/MEMORY.md` (아키텍처 패턴 기록)

---

**작성자**: Claude Code (Sonnet 4.5)
**날짜**: 2026-02-15
**관련 이슈**: 승인 관리 페이지 부적합 재개 카운트 오류
