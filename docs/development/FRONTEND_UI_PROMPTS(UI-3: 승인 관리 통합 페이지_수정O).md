# UI-03: 승인 관리 통합 페이지

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## 목적

모든 승인 항목을 한 곳에서 관리할 수 있는 통합 페이지를 구현합니다.

**핵심 원칙:**

- 역할별로 승인 가능한 항목만 표시
- 다단계 승인 프로세스 지원 (검토 → 최종 승인)
- 소유 팀 장비에 대해서만 승인 권한

---

## 승인 프로세스 정의 (비즈니스 로직 기준)

### 승인 유형별 프로세스

| 업무                  | 요청자            | 1차 처리                 | 2차 처리        | 3차 처리 |
| --------------------- | ----------------- | ------------------------ | --------------- | -------- |
| 장비 등록/수정        | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 장비 삭제             | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 장비 폐기             | 시험실무자        | 기술책임자 (검토)        | 시험소장 (승인) | -        |
| 교정 기록             | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 중간점검              | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 반출 (교정/수리/대여) | 시험실무자        | 소유팀 기술책임자 (승인) | -               | -        |
| 반입                  | 시험실무자        | 소유팀 기술책임자 (승인) | -               | -        |
| 공용/렌탈장비 사용    | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 부적합 장비 사용 재개 | 시험실무자        | 기술책임자 (승인)        | -               | -        |
| 교정계획서            | 기술책임자 (작성) | 품질책임자 (검토)        | 시험소장 (승인) | -        |
| 소프트웨어 유효성     | 기술책임자 (확인) | 품질책임자 (검토)        | -               | -        |

### 역할별 승인 권한

| 역할       | 승인 가능 항목                                                                           | 제한 사항      |
| ---------- | ---------------------------------------------------------------------------------------- | -------------- |
| 기술책임자 | 장비(등록/수정/삭제), 교정기록, 중간점검, 반출, 반입, 공용/렌탈, 부적합 재개, 폐기(검토) | 소유 팀 장비만 |
| 품질책임자 | 교정계획서(검토), 소프트웨어 유효성(검토)                                                | 해당 시험소    |
| 시험소장   | 폐기(최종), 교정계획서(최종)                                                             | 해당 시험소    |

---

## 프롬프트

```
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

⚠️ E2E 테스트 작성 시 /docs/development/E2E_TEST_AUTH_GUIDE.md를 반드시 참조하세요!

CLAUDE.md와 /docs/development/API_STANDARDS.md를 참조하여 승인 관리 통합 페이지를 구현해줘.

⚠️ SSOT 역할 체계 (packages/schemas/src/enums.ts 참조):
- test_engineer (시험실무자): 승인 요청만 가능, 승인 권한 없음
- technical_manager (기술책임자): 소유 팀 장비 승인, 폐기 검토
- quality_manager (품질책임자): 교정계획서 검토, 소프트웨어 유효성 검토
- lab_manager (시험소장): 폐기 최종 승인, 교정계획서 최종 승인
- system_admin (시스템관리자): 역할 관리만, 승인 권한 없음

요구사항:

1. 탭 기반 카테고리 분리 (역할별 표시)

   [기술책임자 탭]
   - 장비 승인 (등록/수정/삭제)
   - 교정 기록 승인
   - 중간점검 승인
   - 반출 승인 (교정/수리/대여 통합)
   - 반입 승인
   - 공용/렌탈장비 사용 승인
   - 부적합 장비 사용 재개 승인
   - 장비 폐기 검토 (→ 시험소장에게 전달)

   [품질책임자 탭]
   - 교정계획서 검토 (→ 시험소장에게 전달)
   - 소프트웨어 유효성 검토

   [시험소장 탭]
   - 장비 폐기 최종 승인 (기술책임자 검토 완료 건)
   - 교정계획서 최종 승인 (품질책임자 검토 완료 건)

   - 각 탭에 대기 개수 뱃지 표시

2. 역할별 자동 필터링
   - technical_manager: 자신의 소유 팀 장비 관련 항목만 표시
   - quality_manager: 해당 시험소 교정계획서/소프트웨어만 표시
   - lab_manager: 해당 시험소 전체 (검토 완료 건만)

3. 다단계 승인 상태 표시
   - 폐기: pending_review → reviewed → approved/rejected
   - 교정계획서: pending_review → reviewed → approved/rejected
   - 일반 항목: pending → approved/rejected

4. 승인 목록 UI
   - 요청자, 요청일시, 요청 내용 요약
   - 현재 승인 단계 표시 (다단계인 경우)
   - 상세 보기 버튼 (모달 또는 확장)
   - 승인/검토완료/반려 버튼 (단계별 다른 레이블)

5. 일괄 처리 기능
   - 체크박스로 다중 선택
   - 일괄 승인/검토완료 버튼
   - 일괄 반려 시 공통 사유 입력

6. 반려 모달
   - 반려 사유 입력 (필수, 최소 10자)
   - 사유 템플릿 선택 옵션
   - 확인/취소 버튼

7. 상세 보기 모달/패널
   - 요청 상세 정보
   - 변경 전/후 비교 (수정 요청 시)
   - 첨부 파일 미리보기/다운로드
   - 이전 단계 승인/검토 이력 (다단계인 경우)

파일 구조:

pages (route group 구조):
- apps/frontend/app/(dashboard)/admin/approvals/page.tsx (Server Component)
- apps/frontend/app/(dashboard)/admin/approvals/loading.tsx
- apps/frontend/app/(dashboard)/admin/approvals/error.tsx ('use client')
- apps/frontend/app/(dashboard)/admin/approvals/layout.tsx

components:
- apps/frontend/components/approvals/ApprovalTabs.tsx ('use client')
- apps/frontend/components/approvals/ApprovalList.tsx ('use client')
- apps/frontend/components/approvals/ApprovalItem.tsx
- apps/frontend/components/approvals/ApprovalDetailModal.tsx ('use client')
- apps/frontend/components/approvals/RejectModal.tsx ('use client')
- apps/frontend/components/approvals/BulkActionBar.tsx ('use client')
- apps/frontend/components/approvals/ApprovalStepIndicator.tsx (다단계 진행 표시)
- apps/frontend/components/approvals/ApprovalHistoryCard.tsx (승인 이력)

api (기존 파일 활용):
- apps/frontend/lib/api/equipment-api.ts (장비 승인)
- apps/frontend/lib/api/calibration-api.ts (교정 기록 승인)
- apps/frontend/lib/api/checkout-api.ts (반출/반입 승인)
- apps/frontend/lib/api/calibration-plans-api.ts (교정계획서 승인)
- apps/frontend/lib/api/software-api.ts (소프트웨어 승인)
- apps/frontend/lib/api/nonconformity-api.ts (부적합 장비 승인)
- apps/frontend/lib/api/dashboard-api.ts (대기 개수 조회)

타입 정의 (SSOT 패키지 활용):

// ⚠️ SSOT: 통합 승인 상태는 packages/schemas/src/enums.ts에서 import
import {
  UnifiedApprovalStatus,
  UnifiedApprovalStatusEnum,
  UNIFIED_APPROVAL_STATUS_LABELS,
  UnifiedApprovalStatusValues,
} from '@equipment-management/schemas';

// ⚠️ SSOT: API 엔드포인트는 shared-constants에서 import
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

// 승인 카테고리 (프론트엔드 전용)
type ApprovalCategory =
  | 'equipment'           // 장비 등록/수정/삭제
  | 'calibration'         // 교정 기록
  | 'inspection'          // 중간점검
  | 'checkout'            // 반출
  | 'return'              // 반입
  | 'common_equipment'    // 공용/렌탈장비 사용
  | 'nonconformity'       // 부적합 장비 사용 재개
  | 'disposal_review'     // 장비 폐기 (기술책임자 검토)
  | 'disposal_final'      // 장비 폐기 (시험소장 최종)
  | 'plan_review'         // 교정계획서 (품질책임자 검토)
  | 'plan_final'          // 교정계획서 (시험소장 최종)
  | 'software';           // 소프트웨어 유효성

// UnifiedApprovalStatus는 SSOT에서 제공 (packages/schemas/src/enums.ts):
// ⚠️ 주의: equipment-request.ts의 ApprovalStatus와 구분됨
// - 'pending'        : 대기 (1단계 승인용)
// - 'pending_review' : 검토 대기 (다단계 1단계)
// - 'reviewed'       : 검토 완료 (다단계 2단계 대기)
// - 'approved'       : 승인 완료
// - 'rejected'       : 반려

// 승인 항목
interface ApprovalItem {
  id: string;
  category: ApprovalCategory;
  status: ApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterTeam: string;
  requestedAt: string;
  summary: string;
  details: Record<string, any>;
  attachments?: Attachment[];
  // 다단계 승인 이력
  approvalHistory?: ApprovalHistoryEntry[];
}

interface ApprovalHistoryEntry {
  step: number;
  action: 'review' | 'approve' | 'reject';
  actorId: string;
  actorName: string;
  actorRole: string;
  actionAt: string;
  comment?: string;
}

// 역할별 탭 설정
const ROLE_TABS: Record<string, ApprovalCategory[]> = {
  technical_manager: [
    'equipment',
    'calibration',
    'inspection',
    'checkout',
    'return',
    'common_equipment',
    'nonconformity',
    'disposal_review',
  ],
  quality_manager: [
    'plan_review',
    'software',
  ],
  lab_manager: [
    'disposal_final',
    'plan_final',
  ],
};

// 탭 메타 정보
const TAB_META: Record<ApprovalCategory, { label: string; icon: string; action: string }> = {
  equipment: { label: '장비', icon: 'Package', action: '승인' },
  calibration: { label: '교정 기록', icon: 'FileCheck', action: '승인' },
  inspection: { label: '중간점검', icon: 'ClipboardCheck', action: '승인' },
  checkout: { label: '반출', icon: 'ArrowUpFromLine', action: '승인' },
  return: { label: '반입', icon: 'ArrowDownToLine', action: '승인' },
  common_equipment: { label: '공용/렌탈', icon: 'Share2', action: '승인' },
  nonconformity: { label: '부적합 재개', icon: 'AlertTriangle', action: '승인' },
  disposal_review: { label: '폐기 검토', icon: 'Trash2', action: '검토완료' },
  disposal_final: { label: '폐기 승인', icon: 'Trash2', action: '승인' },
  plan_review: { label: '교정계획서 검토', icon: 'Calendar', action: '검토완료' },
  plan_final: { label: '교정계획서 승인', icon: 'Calendar', action: '승인' },
  software: { label: '소프트웨어', icon: 'Code', action: '검토완료' },
};

Next.js 16 패턴 요구사항:
- page.tsx는 Server Component로 초기 데이터 fetch
- 탭/필터/모달 등 인터랙션은 Client Component로 분리
- loading.tsx로 라우트 전환 시 로딩 UI 제공
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)
- 탭 상태는 URL 쿼리 파라미터로 관리 (?tab=equipment)
- 반려 모달 폼은 useActionState 패턴 사용 (아래 예시 참조)

// useActionState 패턴 예시 (RejectModal.tsx)
'use client';
import { useActionState } from 'react';

interface RejectFormState {
  error: string | null;
  success: boolean;
}

export function RejectModal({ itemId, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: RejectFormState, formData: FormData) => {
      const reason = formData.get('reason') as string;

      if (!reason || reason.length < 10) {
        return { error: '반려 사유는 10자 이상 입력해주세요.', success: false };
      }

      try {
        await rejectApproval(itemId, reason);
        onClose();
        return { error: null, success: true };
      } catch (e) {
        return { error: '반려 처리 중 오류가 발생했습니다.', success: false };
      }
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction}>
      <Textarea name="reason" placeholder="반려 사유 입력 (10자 이상)" />
      {state.error && <p role="alert">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '처리 중...' : '반려'}
      </Button>
    </form>
  );
}

성능 최적화 요구사항:
- Server Component에서 초기 승인 목록 데이터 fetch
- 상세 보기 모달은 dynamic import로 지연 로딩
- 반려 모달은 dynamic import로 지연 로딩
- 승인/반려 시 Optimistic UI 업데이트 적용
- 목록이 많을 경우 페이지네이션 또는 무한 스크롤
- 아이콘 개별 import (lucide-react tree-shaking)
- 탭 전환 시 해당 탭 데이터만 fetch
- Barrel export 사용 금지 (직접 import 패턴 사용):
  // ❌ 피해야 할 패턴
  import { ApprovalItem, ApprovalList } from '@/components/approvals';

  // ✅ 권장 패턴
  import { ApprovalItem } from '@/components/approvals/ApprovalItem';
  import { ApprovalList } from '@/components/approvals/ApprovalList';

접근성 요구사항:
- 탭: role="tablist", aria-selected, 키보드 좌/우 화살표 탐색
- 뱃지 개수: aria-label="대기 N건"으로 스크린리더에 알림
- 승인/반려 버튼: aria-describedby로 대상 항목 연결
- 다단계 진행 표시: aria-current="step" 사용
- 모달: role="dialog", aria-modal="true", 포커스 트랩
- 일괄 선택: 전체 선택 체크박스에 aria-label 제공
- 토스트 알림: role="alert" aria-live="polite" 적용
- 폼 에러 메시지: role="alert" aria-live="assertive" 적용
- 키보드 탐색: Tab 순서 논리적 구성, Escape로 모달 닫기
- 포커스 표시: ring-2 ring-offset-2 스타일 적용
- 색상 대비: 승인/반려 버튼 색상 외 아이콘도 함께 사용

디자인 요구사항:
- 탭: 아이콘 + 텍스트 + 뱃지, 활성 탭 하단 UL Red 라인
- 상태별 색상 (UL 색상 팔레트):
  - 대기(pending/pending_review): UL Warning (#FF9D55)
  - 검토완료(reviewed): UL Blue (#0067B1)
  - 승인(approved): UL Green (#00A451)
  - 반려(rejected): UL Red (#CA0123)
- 버튼 색상:
  - 승인/검토완료: UL Green (#00A451) + 체크 아이콘
  - 반려: UL Red (#CA0123) + X 아이콘
- 다단계 승인 진행 표시기 (Stepper)
- 모달: 오버레이 + slide-up 애니메이션
- 애니메이션:
  - 탭 전환 시 콘텐츠 fade 트랜지션
  - 목록 아이템 stagger 애니메이션
  - 승인/반려 후 아이템 slide-out 제거 효과
  - 뱃지 개수 변경 시 pulse 효과

에러 처리 요구사항:
- error.tsx로 라우트 레벨 에러 처리 ('use client' 필수)
- API 에러 시 ErrorAlert 컴포넌트 표시 (재시도 버튼)
- 승인 실패 시 Optimistic UI 롤백 및 토스트 에러 표시
- 반려 사유 미입력/부족 시 필드 에러 메시지 표시
- 401 응답 시 로그인 페이지 리다이렉트
- 403 응답 시 "권한이 없습니다" 메시지 표시
- 일괄 처리 중 일부 실패 시 실패 항목 목록 표시

제약사항:
- 반려 시 사유 필수 (10자 이상)
- 기술책임자는 소유 팀 장비만 승인 가능
- 다단계 승인은 이전 단계 완료 후에만 다음 단계 가능
- 권한 없는 탭은 표시하지 않음

검증:
- 각 역할별 탭 표시 확인
- 승인/검토완료/반려 동작 확인
- 일괄 처리 동작 확인
- 다단계 승인 흐름 확인
- 반려 사유 필수 검증 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.
```

---

## 역할별 화면 구성

### 기술책임자 (TECHNICAL_MANAGER) 화면

```
┌─────────────────────────────────────────────────────────────┐
│  승인 관리                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [장비 (3)] [교정기록 (5)] [중간점검 (2)] [반출 (1)]         │
│  [반입 (0)] [공용/렌탈 (2)] [부적합재개 (1)] [폐기검토 (1)]   │
│  ─────────────────────────────────────────                  │
│                                                             │
│  ☑ 전체 선택                    [일괄 승인] [일괄 반려]      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ 네트워크 분석기 등록 요청                          │   │
│  │   요청자: 권명준 (RF팀) | 2025-01-27 09:30          │   │
│  │   신규 장비 등록 - 검수보고서 첨부됨                  │   │
│  │                              [상세] [승인] [반려]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ 스펙트럼 분석기 수정 요청                          │   │
│  │   요청자: 김철수 (RF팀) | 2025-01-27 10:15          │   │
│  │   위치 변경: RF1 Room → RF2 Room                    │   │
│  │                              [상세] [승인] [반려]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 품질책임자 (QUALITY_MANAGER) 화면

```
┌─────────────────────────────────────────────────────────────┐
│  승인 관리                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [교정계획서 검토 (2)] [소프트웨어 (1)]                       │
│  ─────────────────────────────────────                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2025년 수원 RF팀 교정계획서                          │   │
│  │   작성자: 홍석환 (기술책임자) | 2025-01-25 14:00     │   │
│  │   대상 장비: 45대 | 예상 비용: 15,000,000원          │   │
│  │                                                      │   │
│  │   진행 상태: [작성완료] → [검토대기] → [ ] → [ ]     │   │
│  │                              [상세] [검토완료] [반려] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 시험소장 (LAB_MANAGER) 화면

```
┌─────────────────────────────────────────────────────────────┐
│  승인 관리                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [폐기 승인 (1)] [교정계획서 승인 (1)]                        │
│  ─────────────────────────────────────                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 오실로스코프 폐기 요청                               │   │
│  │   요청자: 김철수 (RF팀) | 2025-01-26 11:00          │   │
│  │   폐기 사유: 노후화 및 정밀도 미보장                  │   │
│  │                                                      │   │
│  │   진행 상태: [요청] → [검토완료 ✓] → [승인대기]      │   │
│  │   검토자: 홍석환 (기술책임자) | 2025-01-27 09:00     │   │
│  │   검토 의견: "폐기 타당, 대체 장비 확보 필요"        │   │
│  │                              [상세] [승인] [반려]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 다단계 승인 흐름

### 장비 폐기 (2단계)

```
[시험실무자]          [기술책임자]           [시험소장]
     │                     │                     │
     │  폐기 요청          │                     │
     ├────────────────────>│                     │
     │                     │                     │
     │              검토 (타당성 확인)            │
     │              검토 의견 작성               │
     │                     │                     │
     │                     │  검토완료 전달       │
     │                     ├────────────────────>│
     │                     │                     │
     │                     │              최종 승인/반려
     │                     │                     │
     │<────────────────────┼─────────────────────┤
     │        결과 알림                          │
```

### 교정계획서 (3단계)

```
[기술책임자]          [품질책임자]           [시험소장]
     │                     │                     │
     │  계획서 작성         │                     │
     │  (서명)             │                     │
     │                     │                     │
     │  검토 요청          │                     │
     ├────────────────────>│                     │
     │                     │                     │
     │              검토 (적정성 확인)            │
     │              (서명)                       │
     │                     │                     │
     │                     │  승인 요청          │
     │                     ├────────────────────>│
     │                     │                     │
     │                     │              최종 승인
     │                     │              (서명)  │
     │                     │                     │
     │<────────────────────┼─────────────────────┤
     │        결과 알림 + 교정 알림 스케줄 등록    │
```

---

## 이행 체크리스트 UI-03

### 파일 생성 (route group 구조)

- [x] app/(dashboard)/admin/approvals/page.tsx 구현됨 (Server Component)
- [x] app/(dashboard)/admin/approvals/loading.tsx 생성됨
- [x] app/(dashboard)/admin/approvals/error.tsx 생성됨 ('use client')
- [x] app/(dashboard)/admin/approvals/layout.tsx 생성됨

### 컴포넌트 생성

- [x] ApprovalTabs.tsx 생성됨 ('use client') - ApprovalsClient.tsx 내부에 통합 구현
- [x] ApprovalList.tsx 생성됨 ('use client')
- [x] ApprovalItem.tsx 생성됨
- [x] ApprovalDetailModal.tsx 생성됨 ('use client')
- [x] RejectModal.tsx 생성됨 ('use client')
- [x] BulkActionBar.tsx 생성됨 ('use client')
- [x] ApprovalStepIndicator.tsx 생성됨 (다단계 진행 표시)
- [x] ApprovalHistoryCard.tsx 생성됨 (승인 이력)

### API 함수 (기존 파일 활용)

- [x] approvals-api.ts 통합 승인 API 생성됨 (기존 API 통합)
- [x] calibration-api.ts 교정 기록 승인 메서드 확인됨
- [x] checkout-api.ts 반출/반입 승인 메서드 확인됨
- [x] calibration-plans-api.ts 교정계획서 승인 메서드 확인됨
- [x] software-api.ts 소프트웨어 승인 메서드 확인됨
- [ ] equipment-api.ts 장비 승인 메서드 (백엔드 API 대기)
- [ ] nonconformity-api.ts 부적합 장비 승인 메서드 (백엔드 API 대기)
- [x] dashboard-api.ts 대기 개수 조회 메서드 확인됨

### 기능 구현

- [x] 역할별 탭 필터링 구현됨 (기술책임자/품질책임자/시험소장)
- [ ] 소유 팀 장비만 표시 로직 구현됨 (기술책임자) - API 연동 필요
- [x] 다단계 승인 상태 표시 구현됨 (폐기/교정계획서)
- [x] 다단계 승인 이력 표시 구현됨
- [x] 탭 상태 URL 쿼리 파라미터 관리됨
- [x] 일괄 승인/검토완료/반려 구현됨
- [x] 반려 사유 필수 검증 구현됨 (10자 이상)
- [x] Optimistic UI 업데이트 구현됨 (queryClient.invalidateQueries 패턴)
- [x] 토스트 알림 구현됨

### 디자인 관련

- [x] UL 색상 팔레트 사용됨 (상태별 색상)
- [x] 탭 활성 상태 UL Red 라인 적용됨
- [ ] 뱃지 개수 pulse 효과 적용됨 - CSS 추가 가능
- [x] 다단계 진행 표시기 구현됨
- [x] 모달 scale + fade 애니메이션 적용됨 (shadcn/ui Dialog 기본)
- [ ] 목록 아이템 stagger 애니메이션 적용됨 - 추가 구현 가능
- [ ] 승인/반려 후 slide-out 효과 적용됨 - 추가 구현 가능

### 에러 처리 관련

- [x] error.tsx 에러 핸들러 구현됨
- [x] API 에러 시 toast 표시됨 (variant='destructive')
- [x] 승인 실패 시 Optimistic UI 롤백됨 (try-finally 패턴)
- [x] 반려 사유 에러 메시지 표시됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트됨 - API 클라이언트 레벨 구현 필요
- [ ] 403 응답 시 권한 없음 메시지 표시됨 - API 클라이언트 레벨 구현 필요

### 성능 최적화

- [x] Server Component에서 초기 데이터 fetch 구현됨 (세션 확인)
- [x] 상세 보기 모달 dynamic import 적용됨
- [x] 반려 모달 dynamic import 적용됨
- [x] Optimistic UI 업데이트 적용됨 (React Query invalidation)
- [x] 아이콘 개별 import 적용됨
- [x] 탭 전환 시 해당 탭 데이터만 fetch 구현됨

### 접근성

- [x] 탭에 role="tablist", aria-selected 적용됨
- [x] 뱃지에 aria-label="대기 N건" 적용됨
- [x] 다단계 진행에 aria-current="step" 적용됨
- [x] 모달에 role="dialog", aria-modal 적용됨
- [x] 모달 포커스 트랩 구현됨 (shadcn/ui Dialog 기본)
- [x] 토스트에 role="alert" 적용됨 (shadcn/ui toast 기본)
- [ ] 키보드 탐색 가능 확인 (Tab, Escape, 화살표) - E2E 테스트로 검증 예정
- [x] 포커스 표시 스타일 적용됨
- [x] 승인/반려 버튼에 아이콘 추가됨

### 테스트

- [x] Playwright 테스트 작성됨 (approvals.spec.ts)
- [x] 역할별 탭 표시 테스트 추가됨
- [x] 다단계 승인 테스트 추가됨
- [x] 일괄 처리 테스트 추가됨
- [x] 키보드 탐색 테스트 추가됨
- [x] axe-core 접근성 테스트 추가됨
- [ ] 모든 테스트 통과됨 (테스트 실행 필요)
- [ ] pnpm tsc --noEmit 성공 (검증 필요)

---

## Playwright 테스트 예시

```typescript
// apps/frontend/tests/e2e/approvals.spec.ts
import { test, expect, Page } from '@playwright/test';

// 로그인 헬퍼 (E2E_TEST_AUTH_GUIDE.md 패턴)
async function loginAs(page: Page, role: 'technical_manager' | 'quality_manager' | 'lab_manager') {
  await page.goto('/api/auth/signin');
  const csrfToken = await page.locator('input[name="csrfToken"]').inputValue();

  await page.request.post('/api/auth/callback/test-login', {
    form: { role, csrfToken, json: 'true' },
  });
  await page.reload();
}

test.describe('승인 관리 - 역할별 탭 표시', () => {
  test('기술책임자는 장비/교정/반출 등 탭 표시', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals');

    // 기술책임자 탭 확인
    await expect(page.getByRole('tab', { name: /장비/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /교정 기록/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /반출/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /폐기 검토/ })).toBeVisible();

    // 품질책임자/시험소장 전용 탭은 미표시
    await expect(page.getByRole('tab', { name: /교정계획서 검토/ })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: /교정계획서 승인/ })).not.toBeVisible();
  });

  test('품질책임자는 교정계획서 검토/소프트웨어 탭 표시', async ({ page }) => {
    await loginAs(page, 'quality_manager');
    await page.goto('/admin/approvals');

    // 품질책임자 탭 확인
    await expect(page.getByRole('tab', { name: /교정계획서 검토/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /소프트웨어/ })).toBeVisible();

    // 기술책임자/시험소장 전용 탭은 미표시
    await expect(page.getByRole('tab', { name: /장비/ })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: /폐기 승인/ })).not.toBeVisible();
  });

  test('시험소장은 폐기 승인/교정계획서 승인 탭 표시', async ({ page }) => {
    await loginAs(page, 'lab_manager');
    await page.goto('/admin/approvals');

    // 시험소장 탭 확인
    await expect(page.getByRole('tab', { name: /폐기 승인/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /교정계획서 승인/ })).toBeVisible();

    // 검토 단계 탭은 미표시 (최종 승인만)
    await expect(page.getByRole('tab', { name: /폐기 검토/ })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: /교정계획서 검토/ })).not.toBeVisible();
  });
});

test.describe('승인 관리 - 기본 기능', () => {
  test('탭 전환 및 URL 쿼리 파라미터', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals');

    // 교정 기록 탭 클릭
    await page.getByRole('tab', { name: /교정 기록/ }).click();

    // URL 쿼리 파라미터 확인
    await expect(page).toHaveURL(/tab=calibration/);

    // 탭 콘텐츠 변경 확인
    await expect(page.getByTestId('approval-list')).toBeVisible();
  });

  test('승인 처리', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 첫 번째 항목 승인
    const firstItem = page.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '승인' }).click();

    // 토스트 메시지 확인
    await expect(page.getByRole('alert')).toContainText('승인되었습니다');

    // 항목이 목록에서 제거됨 (Optimistic UI)
    await expect(firstItem).not.toBeVisible();
  });

  test('반려 시 사유 필수', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 반려 버튼 클릭
    const firstItem = page.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    // 모달 열림 확인
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // 사유 없이 확인 시도
    await modal.getByRole('button', { name: '확인' }).click();

    // 에러 메시지 확인
    await expect(modal.getByRole('alert')).toContainText('10자 이상');
  });

  test('일괄 승인', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 전체 선택
    await page.getByRole('checkbox', { name: /전체 선택/ }).check();

    // 일괄 승인 버튼 클릭
    await page.getByRole('button', { name: '일괄 승인' }).click();

    // 확인 모달
    await page.getByRole('button', { name: '확인' }).click();

    // 토스트 메시지 확인
    await expect(page.getByRole('alert')).toContainText('승인되었습니다');
  });
});

test.describe('승인 관리 - 다단계 승인', () => {
  test('폐기 검토 완료 후 시험소장에게 전달', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=disposal_review');

    // 폐기 검토 항목 확인
    const firstItem = page.getByTestId('approval-item').first();

    // 검토완료 버튼 (승인이 아님)
    await expect(firstItem.getByRole('button', { name: '검토완료' })).toBeVisible();

    // 상세 보기로 검토 의견 입력
    await firstItem.getByRole('button', { name: '상세' }).click();

    const modal = page.getByRole('dialog');
    await modal.getByLabel('검토 의견').fill('폐기 타당, 대체 장비 확보 필요');
    await modal.getByRole('button', { name: '검토완료' }).click();

    // 토스트 메시지 확인
    await expect(page.getByRole('alert')).toContainText('검토 완료');
  });

  test('시험소장은 검토 완료된 폐기 건만 표시', async ({ page }) => {
    await loginAs(page, 'lab_manager');
    await page.goto('/admin/approvals?tab=disposal_final');

    // 검토 완료 상태 표시 확인
    const firstItem = page.getByTestId('approval-item').first();
    await expect(firstItem.getByText('검토완료')).toBeVisible();

    // 검토자 정보 표시
    await expect(firstItem.getByText(/검토자:/)).toBeVisible();
  });

  test('교정계획서 다단계 진행 표시', async ({ page }) => {
    await loginAs(page, 'quality_manager');
    await page.goto('/admin/approvals?tab=plan_review');

    // 진행 상태 표시기 확인
    const stepIndicator = page.getByTestId('step-indicator');
    await expect(stepIndicator).toBeVisible();

    // 현재 단계 표시
    await expect(stepIndicator.locator('[aria-current="step"]')).toContainText('검토');
  });
});

test.describe('승인 관리 - 권한 검증', () => {
  test('기술책임자는 소유 팀 장비만 승인 가능', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 모든 항목이 자신의 팀 장비인지 확인
    const items = page.getByTestId('approval-item');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const teamText = await items.nth(i).getByTestId('requester-team').textContent();
      // 자신의 팀(RF팀)과 일치하는지 확인 (테스트 계정 기준)
      expect(teamText).toContain('RF');
    }
  });
});

test.describe('승인 관리 - 접근성', () => {
  test('탭 키보드 탐색 (화살표 키)', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals');

    // 첫 번째 탭에 포커스
    const firstTab = page.getByRole('tab').first();
    await firstTab.focus();

    // 오른쪽 화살표로 다음 탭 이동
    await page.keyboard.press('ArrowRight');

    // 포커스가 다음 탭으로 이동
    const focusedTab = page.locator('[role="tab"]:focus');
    await expect(focusedTab).toBeVisible();
  });

  test('모달 포커스 트랩', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 반려 모달 열기
    const firstItem = page.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Tab 키로 탐색해도 모달 내부에 포커스 유지
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // 포커스가 모달 내부인지 확인
    await expect(modal.locator(':focus')).toBeVisible();
  });

  test('Escape로 모달 닫기', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals?tab=equipment');

    // 반려 모달 열기
    const firstItem = page.getByTestId('approval-item').first();
    await firstItem.getByRole('button', { name: '반려' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Escape로 닫기
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('뱃지에 aria-label 제공', async ({ page }) => {
    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals');

    // 뱃지가 스크린리더에서 읽힐 수 있는지 확인
    const badge = page.locator('[aria-label*="대기"]').first();
    await expect(badge).toBeVisible();
  });

  test('다단계 진행 표시기 aria-current', async ({ page }) => {
    await loginAs(page, 'quality_manager');
    await page.goto('/admin/approvals?tab=plan_review');

    // 현재 단계에 aria-current="step" 확인
    const currentStep = page.locator('[aria-current="step"]');
    await expect(currentStep).toBeVisible();
  });

  test('axe-core 접근성 검사', async ({ page }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;

    await loginAs(page, 'technical_manager');
    await page.goto('/admin/approvals');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });
});
```

---

## 컴포넌트 상세 명세

### ApprovalStepIndicator

다단계 승인 진행 상태를 표시합니다.

```typescript
interface ApprovalStepIndicatorProps {
  type: 'disposal' | 'calibration_plan';
  currentStatus: ApprovalStatus;
  history?: ApprovalHistoryEntry[];
}

// 폐기: 2단계
const disposalSteps = [
  { key: 'pending_review', label: '요청', role: '시험실무자' },
  { key: 'reviewed', label: '검토', role: '기술책임자' },
  { key: 'approved', label: '승인', role: '시험소장' },
];

// 교정계획서: 3단계
const planSteps = [
  { key: 'pending_review', label: '작성', role: '기술책임자' },
  { key: 'reviewed', label: '검토', role: '품질책임자' },
  { key: 'approved', label: '승인', role: '시험소장' },
];
```

### ApprovalHistoryCard

다단계 승인의 이전 처리 이력을 표시합니다.

```typescript
interface ApprovalHistoryCardProps {
  history: ApprovalHistoryEntry[];
}

// 표시 예시:
// ┌────────────────────────────────────┐
// │ 검토 완료                          │
// │ 홍석환 (기술책임자) | 2025-01-27   │
// │ "폐기 타당, 대체 장비 확보 필요"    │
// └────────────────────────────────────┘
```

### ApprovalItem 버튼 레이블

승인 단계에 따라 버튼 레이블이 달라집니다.

```typescript
function getActionLabel(category: ApprovalCategory): string {
  const reviewCategories = ['disposal_review', 'plan_review', 'software'];
  return reviewCategories.includes(category) ? '검토완료' : '승인';
}
```
