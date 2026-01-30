# 프론트엔드 UI 개발 프롬프트

> **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-8: 장비 등록/수정 폼

### 목적

장비 등록 및 수정을 위한 통합 폼 컴포넌트를 구현합니다. UL-QP-18 장비 관리 절차서 기반의 역할별 권한 체계와 승인 워크플로우를 반영합니다.

---

### 역할 체계 (UL-QP-18 기준)

| 역할         | 영문 코드           | 주요 권한                                     |
| ------------ | ------------------- | --------------------------------------------- |
| 시험실무자   | `test_engineer`     | 장비 등록/수정/삭제/폐기 요청 (승인 필요)     |
| 기술책임자   | `technical_manager` | 장비 승인, 담당 팀 관리, 폐기 검토            |
| 품질책임자   | `quality_manager`   | 조회, 교정계획서 검토, 소프트웨어 유효성 검토 |
| 시험소장     | `lab_manager`       | 전체 권한, 폐기 최종 승인                     |
| 시스템관리자 | `system_admin`      | 전체 권한 (시스템 레벨)                       |

---

### 장비 상태 정의 (EquipmentStatus)

#### 기본 상태 (현재 구현)

| 상태           | 영문 코드               | 설명                                   |
| -------------- | ----------------------- | -------------------------------------- |
| 사용 가능      | `available`             | 정상 사용 가능한 상태                  |
| 사용 중        | `in_use`                | 대여 중인 상태 포함                    |
| 반출 중        | `checked_out`           | 외부 교정/수리/대여를 위해 반출된 상태 |
| 교정 예정      | `calibration_scheduled` | 교정 일정이 임박한 상태 (D-day 표시)   |
| 교정 기한 초과 | `calibration_overdue`   | 교정 기한이 지난 상태 (D+day 표시)     |
| 부적합         | `non_conforming`        | 임시적 부적합 (수리 후 복귀 가능)      |
| 여분           | `spare`                 | 보유하고 있지만 상시 관리하지 않음     |
| 폐기           | `retired`               | 사용 중지 (영구 폐기)                  |

#### 확장 상태 (향후 구현 예정)

| 상태      | 영문 코드          | 설명                    |
| --------- | ------------------ | ----------------------- |
| 폐기 대기 | `pending_disposal` | 폐기 승인 대기 중       |
| 폐기 완료 | `disposed`         | 폐기 완료               |
| 임시 등록 | `temporary`        | 공용/렌탈장비 임시 등록 |
| 비활성    | `inactive`         | 임시등록 장비 사용 완료 |

---

### 장비 유형별 등록 방식

| 유형            | 설명                 | 등록 방식 | 필수 첨부파일 |
| --------------- | -------------------- | --------- | ------------- |
| 내부장비 (신규) | 신규 구매/도입 장비  | 정식 등록 | 검수보고서    |
| 내부장비 (기존) | 기존 운영 중인 장비  | 정식 등록 | 이력카드      |
| 공용장비        | 타 팀 장비 임시 사용 | 임시 등록 | 교정성적서    |
| 렌탈장비        | 외부 대여 장비       | 임시 등록 | 교정성적서    |

---

### 필수 입력 항목

#### 내부장비 필수 항목

**기본 정보:**

- 관리번호 (자동 생성): `{시험소코드}-{분류코드}{일련번호}` (예: SUW-E0001)
- 장비명 (필수)
- 모델명 (필수)
- 제조사 (필수)
- 시리얼넘버 (필수)
- 장비타입 (필수): 측정기, 보조장비 등
- 소속 시험소 (필수): 수원, 의왕, 평택
- 관리 팀 (필수): 시험소별 팀 필터링
- 현재 위치 (필수)
- 운영책임자(정) (필수)
- 설치일자 (필수)

**교정 정보 (조건부 필수):**

- 교정 필요 여부 (필수)
- 교정 주기 (교정 필요 시 필수)
- 최근 교정일자 (교정 필요 시 필수)
- 차기 교정일 (자동 계산)
- 교정 방법: 외부교정, 자체점검, 비대상

**점검 정보 (조건부 필수):**

- 중간점검 필요 여부 (필수)
- 중간점검 주기 (중간점검 필요 시 필수)

#### 공용장비/렌탈장비 필수 항목

- 장비명 (필수)
- 모델명 (필수)
- 시리얼넘버 (필수)
- 소유처 (필수): Safety Lab, 외부 기관 등
- 교정성적서 (필수 첨부)
- 교정일자 (필수)
- 차기교정일 (필수)
- 사용 예정 기간 (필수)

---

### 승인 워크플로우

#### 장비 등록/수정 프로세스

```
시험실무자          기술책임자
    │                   │
    ├─── 등록 요청 ────→│
    │   (pending)       │
    │                   ├─── 승인 ──→ [등록 완료]
    │                   │   (approved)
    │                   └─── 반려 ──→ [반려됨]
    │                       (rejected)
```

#### 장비 삭제 프로세스

- **삭제 대상**: 잘못 등록된 장비, 중복 등록, 테스트 데이터
- **승인**: 시험실무자 요청 → 기술책임자 승인 (1단계)

#### 장비 폐기 프로세스 (2단계 승인)

```
시험실무자          기술책임자          시험소장
    │                   │                 │
    ├─── 폐기 요청 ────→│                 │
    │   (pending)       │                 │
    │                   ├─── 검토 ───────→│
    │                   │   (reviewed)    │
    │                   │                 ├─── 최종 승인 ──→ [폐기 완료]
    │                   │                 │   (approved)     (retired)
    │                   │                 └─── 반려 ────────→ [반려됨]
    │                   │                     (rejected)
```

- **폐기 대상**: 노후화, 고장(수리 불가), 정밀도/정확도 미보장

---

### 전체 승인 매트릭스 (부록 B)

| 업무              | 요청자     | 1차 처리                 | 2차 처리        |
| ----------------- | ---------- | ------------------------ | --------------- |
| 장비 등록/수정    | 시험실무자 | 기술책임자 (승인)        | -               |
| 장비 삭제         | 시험실무자 | 기술책임자 (승인)        | -               |
| 장비 폐기         | 시험실무자 | 기술책임자 (검토)        | 시험소장 (승인) |
| 교정 기록         | 시험실무자 | 기술책임자 (승인)        | -               |
| 중간점검          | 시험실무자 | 기술책임자 (승인)        | -               |
| 교정계획서        | 기술책임자 | 품질책임자 (검토)        | 시험소장 (승인) |
| 대여              | 시험실무자 | 소유팀 기술책임자 (승인) | -               |
| 반출              | 시험실무자 | 소유팀 기술책임자 (승인) | -               |
| 반입              | 시험실무자 | 기술책임자 (승인)        | -               |
| 공용장비 사용     | 시험실무자 | 기술책임자 (승인)        | -               |
| 소프트웨어 유효성 | 기술책임자 | 품질책임자 (검토)        | -               |

---

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design

AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 장비 등록/수정 폼을 구현해줘.

역할 참고:
- test_engineer (시험실무자): 장비 등록/수정/삭제/폐기 요청 (모두 승인 필요)
- technical_manager (기술책임자): 장비 승인, 담당 팀 관리, 폐기 검토
- quality_manager (품질책임자): 조회 전용, 교정계획서/소프트웨어 유효성 검토
- lab_manager, system_admin: 전체 권한, 폐기 최종 승인

요구사항:

1. 장비 유형별 등록 폼 분기
   - 내부장비 등록 (정식): create/page.tsx
   - 공용장비/렌탈장비 등록 (임시): create-shared/page.tsx
   - 등록 유형 선택 UI 제공

2. 장비 기본 정보 입력 (내부장비)
   - 장비명 (필수)
   - 모델명, 제조사, 시리얼넘버 (필수)
   - 관리번호 (자동 생성: {시험소코드}-{분류코드}{일련번호})
   - 사이트 선택 (suwon/uiwang/pyeongtaek)
   - 팀 선택 (사이트별 팀 필터링)
   - 장비 타입 (측정기, 보조장비 등)
   - 운영책임자(정) (필수)
   - 설치일자 (필수)

3. 교정 관련 정보 (조건부 필수)
   - 교정 필요 여부 (required/not_required)
   - 교정 방법 (external_calibration/self_inspection/not_applicable)
   - 교정 주기 (교정 필요 시 필수)
   - 최근 교정일, 차기 교정일 (교정 필요 시 필수)

4. 점검 정보 (조건부 필수)
   - 중간점검 필요 여부 (필수)
   - 중간점검 주기 (점검 필요 시 필수)

5. 공용장비/렌탈장비 입력 (임시 등록)
   - 장비명, 모델명, 시리얼넘버 (필수)
   - 소유처 (safety_lab/external) (필수)
   - 교정성적서 첨부 (필수)
   - 교정일자, 차기교정일 (필수)
   - 사용 예정 기간 (필수)

6. 상태 및 위치
   - 장비 상태 선택 (역할별 선택 가능 상태 제한)
   - 현재 위치 (필수)
   - isShared 플래그 (공용장비 여부)

7. 파일 첨부
   - 이력카드 (기존 내부장비)
   - 검수보고서 (신규 내부장비)
   - 교정성적서 (공용/렌탈장비 필수)
   - 드래그앤드롭 지원
   - 파일 미리보기
   - 파일 삭제

8. 폼 상태 관리
   - 실시간 유효성 검증
   - 조건부 필수 필드 동적 표시
   - 변경사항 감지 (수정 모드)
   - 저장 전 확인 모달
   - 역할별 안내 메시지 (승인 필요 여부)

9. 승인 워크플로우 표시
   - 시험실무자: "등록 요청 시 기술책임자 승인이 필요합니다" 배너
   - 기술책임자+: "직접 등록됩니다" 안내

파일:
- apps/frontend/app/equipment/create/page.tsx (내부장비)
- apps/frontend/app/equipment/[id]/edit/page.tsx
- apps/frontend/app/equipment/create-shared/page.tsx (공용/렌탈장비)
- apps/frontend/components/equipment/EquipmentForm.tsx (통합 폼)
- apps/frontend/components/equipment/BasicInfoSection.tsx
- apps/frontend/components/equipment/CalibrationInfoSection.tsx
- apps/frontend/components/equipment/StatusLocationSection.tsx
- apps/frontend/components/equipment/AttachmentSection.tsx
- apps/frontend/components/shared/FileUpload.tsx (개선)
- apps/frontend/lib/api/equipment-api.ts
- apps/frontend/app/actions/equipment.ts (Server Actions)

Next.js 16 필수 패턴:
1. 동적 라우트 페이지 (PageProps + await params):
   ```typescript
   // apps/frontend/app/equipment/[id]/edit/page.tsx
   import { PageProps } from 'next';

   export default async function EquipmentEditPage(
     props: PageProps<'/equipment/[id]/edit'>
   ) {
     const { id } = await props.params;  // params는 Promise
     const equipment = await getEquipment(id);
     return <EquipmentForm mode="edit" equipment={equipment} />;
   }
````

2. useActionState 폼 처리:

   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { createEquipment } from '@/app/actions/equipment';

   export function EquipmentForm() {
     const [state, formAction, isPending] = useActionState(
       createEquipment,
       { error: null, success: false }
     );

     return (
       <form action={formAction}>
         {state.error && <ErrorAlert error={state.error} />}
         <Button type="submit" disabled={isPending}>
           {isPending ? '저장 중...' : '저장'}
         </Button>
       </form>
     );
   }
   ```

성능 최적화 요구사항 (/vercel-react-best-practices):

1. **bundle-dynamic-imports**: 파일 업로드 컴포넌트 동적 로딩

   ```typescript
   const FileUpload = dynamic(() => import('./FileUpload'), {
     loading: () => <Skeleton className="h-32" />,
     ssr: false
   });
   ```

2. **rerender-memo**: 무거운 섹션 컴포넌트 메모이제이션

   ```typescript
   const MemoizedCalibrationSection = memo(CalibrationInfoSection);
   ```

3. **async-parallel**: 초기 데이터 병렬 로딩

   ```typescript
   const [sites, teams, equipmentTypes] = await Promise.all([
     getSites(),
     getTeams(),
     getEquipmentTypes(),
   ]);
   ```

4. **server-serialization**: 클라이언트로 전달되는 데이터 최소화
   - 필요한 필드만 선택적으로 전달
   - Date 객체는 문자열로 직렬화

디자인 요구사항 (/frontend-design 스킬 활용):

- 섹션별 카드 분리 (UL Solutions 브랜드 색상 적용)
- 필수 필드 별표(\*) 표시 (Brand Red #CA0123)
- 조건부 필수 필드 동적 표시 (교정 필요 → 교정 주기 필수)
- 파일 업로드 드래그 영역:
  - 점선 테두리 (border-dashed, UL Gray 1 #D8D9DA)
  - 드래그 오버 시 배경색 변경 (UL Info #BCE4F7)
  - 아이콘 + "파일을 여기에 끌어다 놓거나 클릭하세요" 안내
- 진행 상태 표시 (Progress 컴포넌트, UL Green #00A451)
- 역할별 안내 배너:
  - test_engineer: Warning 배너 (UL Orange #FF9D55 배경)
  - 기타 역할: Info 배너 (UL Info #BCE4F7 배경)

접근성 요구사항 (/web-design-guidelines):

- 모든 입력 필드에 명시적 label 연결 (htmlFor + id)
- 필수 필드에 aria-required="true" 추가
- 에러 메시지에 role="alert" 및 aria-live="polite" 추가
- 폼 그룹에 fieldset + legend 사용
- 파일 업로드 영역 키보드 접근 가능 (Enter/Space로 파일 선택)
- 포커스 표시 명확 (outline 스타일 유지)

제약사항:

- react-hook-form + Zod 사용
- 파일 크기 제한 (10MB)
- 파일 형식 제한 (PDF, 이미지, 문서)
- 수정 모드에서 변경된 필드만 전송
- SSOT 패키지 import 필수:
  ```typescript
  import { EquipmentStatus, CalibrationMethod } from '@equipment-management/schemas';
  import { Permission, API_ENDPOINTS } from '@equipment-management/shared-constants';
  ```

검증:

- 필수 필드 검증 테스트
- 조건부 필수 필드 검증 테스트
- 파일 업로드 테스트
- 역할별 동작 테스트
- pnpm tsc --noEmit

Playwright 테스트:

- 필수 필드 미입력 시 에러 표시
- 조건부 필수 필드 동적 표시/숨김
- 파일 업로드 및 삭제 동작
- 폼 제출 성공/실패 처리
- 역할별 승인 안내 메시지 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

---

### 필수 가이드라인

아래 섹션들은 실제 발생한 버그와 코드 분석 결과를 반영한 필수 가이드라인입니다.

#### 1. API 호출 규칙 및 주의사항

**배경**: `/api/api/equipment` URL 중복 버그가 발생하여 404 에러 발생

**환경변수 규칙**:

```bash
# .env.local - 올바른 설정
NEXT_PUBLIC_API_URL=http://localhost:3001    # 호스트만, /api 미포함!

# 잘못된 설정 (절대 사용 금지)
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # /api가 포함되어 URL 중복 발생
````

**API 경로 규칙**:

```typescript
// 모든 API 경로는 '/api/'로 시작해야 함
const response = await apiClient.post('/api/equipment', data); // ✅ 올바름
const response = await apiClient.post('/equipment', data); // ❌ /api 누락
const response = await apiClient.post('/api/api/equipment', data); // ❌ 중복
```

---

#### 2. 에러 처리 요구사항

**필수 에러 상태 처리**:

```typescript
import { ErrorAlert } from '@/components/shared/ErrorAlert';

const [submitError, setSubmitError] = useState<ApiError | null>(null);

const onSubmit = async (data: EquipmentFormData) => {
  try {
    setSubmitError(null);
    await equipmentApi.create(data);
    router.push('/equipment');
  } catch (error) {
    if (error instanceof ApiError) {
      setSubmitError(error);
    } else {
      setSubmitError(new ApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다'));
    }
  }
};
```

**에러 유형별 처리**:

| HTTP 상태 | 에러 유형          | 처리 방법                                     |
| --------- | ------------------ | --------------------------------------------- |
| 400       | 유효성 검증 실패   | 필드별 에러 메시지 표시, 해당 필드 포커스     |
| 401       | 인증 만료          | 로그인 페이지로 리다이렉트                    |
| 403       | 권한 없음          | "접근 권한이 없습니다" 메시지 표시            |
| 409       | 중복 (관리번호 등) | "이미 등록된 관리번호입니다" + 기존 장비 링크 |
| 413       | 파일 크기 초과     | "파일 크기는 10MB 이하여야 합니다"            |
| 500       | 서버 에러          | "서버 오류가 발생했습니다" + 재시도 버튼      |

---

#### 3. form 내 버튼 사용 규칙

**핵심 규칙**: form 또는 Dialog 내부의 모든 Button에 type 속성 필수 명시!

```typescript
// ✅ 올바른 사용
<form onSubmit={handleSubmit(onSubmit)}>
  {/* 파일 업로드 버튼 - Dialog 열기 */}
  <Button type="button" onClick={() => setFileDialogOpen(true)}>
    파일 첨부
  </Button>

  {/* 취소 버튼 */}
  <Button type="button" variant="outline" onClick={() => router.back()}>
    취소
  </Button>

  {/* 저장 버튼 - 폼 제출 */}
  <Button type="submit">저장</Button>
</form>

// ❌ 잘못된 사용 - type 생략 시 기본값이 "submit"
<form>
  <Button onClick={addItem}>항목 추가</Button>  {/* submit 발생! */}
</form>
```

---

#### 4. 인증 토큰 관리 가이드

**핵심 원칙**: **NextAuth를 단일 인증 소스(Single Source of Truth)로 사용**

**Client Component에서 인증**:

```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function EquipmentForm() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <FormSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기 (5개 역할 체계)
  const needsApproval = hasRole('test_engineer');
  const canDirectSubmit = hasRole(['technical_manager', 'quality_manager', 'lab_manager', 'system_admin']);
  const canApproveDisposal = hasRole('lab_manager'); // 폐기 최종 승인

  return (
    <>
      {needsApproval && (
        <Alert variant="warning">
          <AlertDescription>
            시험실무자는 장비 등록 시 기술책임자의 승인이 필요합니다.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
```

---

### 이행 체크리스트 UI-8

#### 컴포넌트 구현

- [x] equipment/create/page.tsx 구현됨
- [x] equipment/[id]/edit/page.tsx 구현됨
- [x] equipment/create-shared/page.tsx 구현됨
- [x] EquipmentForm.tsx 통합 폼 생성됨
- [x] BasicInfoSection.tsx 섹션 생성됨
- [x] CalibrationInfoSection.tsx 섹션 생성됨
- [x] StatusLocationSection.tsx 섹션 생성됨
- [x] AttachmentSection.tsx 섹션 생성됨
- [x] FileUpload.tsx 개선됨
- [x] equipment-api.ts API 함수 생성됨
- [x] actions/equipment.ts Server Actions 생성됨

#### Next.js 16 패턴

- [x] 동적 라우트에서 PageProps 사용됨
- [x] params를 await로 처리함
- [x] useActionState 사용됨 (useFormState 아님)
- [x] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [x] FileUpload 컴포넌트 동적 import 적용됨
- [x] 무거운 섹션 컴포넌트 메모이제이션됨
- [x] 초기 데이터 Promise.all로 병렬 로딩됨
- [x] 클라이언트로 전달되는 데이터 최소화됨
- [x] **이력 일괄 저장 Promise.allSettled 병렬 처리 (async-parallel)** - 2026.01.24 개선
- [x] **tempId 기반 Map 구조로 이력 관리 (인덱스 버그 수정)** - 2026.01.24 개선

#### 기능 구현

- [x] 유효성 검증 구현됨 (react-hook-form + Zod)
- [x] 파일 업로드/삭제 구현됨
- [x] 역할별 안내 메시지 구현됨
- [x] 변경사항 감지 구현됨 (수정 모드)
- [ ] 조건부 필수 필드 동적 표시 (교정 필요 여부에 따른 교정 주기 필수화)
- [ ] 장비 유형별 등록 폼 분기 (내부장비 vs 공용/렌탈장비)

#### 승인 워크플로우

- [ ] 장비 등록 시 승인 상태(pending_approval) 자동 설정 (시험실무자)
- [ ] 기술책임자+ 역할 시 직접 등록(approved) 처리
- [ ] 폐기 2단계 승인 프로세스 구현

#### 에러 처리 관련

- [x] ApiError 클래스 활용됨
- [x] ErrorAlert 컴포넌트 연동됨
- [x] 필드별 에러 표시 구현됨
- [x] 재시도 버튼(onRetry) 구현됨
- [x] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [x] 409 응답 시 중복 에러 처리됨

#### form 버튼 관련

- [x] Dialog 내 모든 Button에 type 속성 명시됨
- [x] form 내 취소/추가 버튼에 type="button" 적용됨
- [x] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [x] 폼에 적절한 ARIA 속성 추가됨 (role="form", aria-label 등)
- [x] 필수 필드에 aria-required="true" 추가됨
- [x] 에러 메시지에 role="alert" 및 aria-live="polite" 추가됨
- [x] 모든 입력 필드에 명시적 label 연결됨 (htmlFor + id)
- [x] 폼 그룹에 fieldset + legend 사용됨
- [x] 파일 업로드에 키보드 접근성 추가됨 (Enter/Space)
- [x] 포커스 표시 명확함 (outline 스타일 유지)
- [x] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [x] Playwright 테스트 작성됨 (equipment-form.spec.ts)
- [x] 에러 시나리오 테스트 작성됨 (equipment-form-errors.spec.ts)
- [x] 모든 테스트 통과됨 (22/22 tests passed)
- [ ] 조건부 필수 필드 테스트 추가
- [ ] 역할별 승인 워크플로우 테스트 추가

---

### Playwright 테스트 예시

```typescript
// tests/e2e/equipment-form.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Equipment Form - Basic', () => {
  test('필수 필드 미입력 시 에러 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 저장 버튼 클릭 (필수 필드 미입력)
    await testOperatorPage.getByRole('button', { name: '저장' }).click();

    // 에러 메시지 표시 확인
    await expect(testOperatorPage.getByText('장비명은 필수입니다')).toBeVisible();
    await expect(testOperatorPage.getByText('사이트를 선택하세요')).toBeVisible();
  });

  test('파일 업로드 동작', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 파일 업로드
    const fileInput = testOperatorPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // 업로드된 파일 표시 확인
    await expect(testOperatorPage.getByText('test-document.pdf')).toBeVisible();

    // 파일 삭제
    await testOperatorPage.getByRole('button', { name: '삭제' }).click();
    await expect(testOperatorPage.getByText('test-document.pdf')).not.toBeVisible();
  });

  test('역할별 안내 메시지 - 시험실무자', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 승인 필요 안내 메시지 확인
    await expect(
      testOperatorPage.getByText('시험실무자는 장비 등록 시 기술책임자의 승인이 필요합니다')
    ).toBeVisible();
  });

  test('폼 제출 성공', async ({ techManagerPage }) => {
    await techManagerPage.goto('/equipment/create');

    // 필수 필드 입력
    await techManagerPage.getByLabel('장비명').fill('테스트 장비');
    await techManagerPage.getByLabel('사이트').selectOption('suwon');
    await techManagerPage.getByLabel('팀').selectOption('rf');

    // 저장
    await techManagerPage.getByRole('button', { name: '저장' }).click();

    // 성공 후 목록 페이지로 이동 확인
    await expect(techManagerPage).toHaveURL('/equipment');
    await expect(techManagerPage.getByText('장비가 등록되었습니다')).toBeVisible();
  });
});

test.describe('Equipment Form - Conditional Fields', () => {
  test('교정 필요 선택 시 교정 주기 필수화', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 교정 필요 선택
    await testOperatorPage.getByLabel('교정 필요 여부').selectOption('required');

    // 교정 주기 필드가 필수로 표시되는지 확인
    await expect(testOperatorPage.getByLabel('교정 주기 *')).toBeVisible();

    // 교정 주기 미입력 시 에러
    await testOperatorPage.getByRole('button', { name: '저장' }).click();
    await expect(testOperatorPage.getByText('교정 주기는 필수입니다')).toBeVisible();
  });

  test('교정 불필요 선택 시 교정 주기 숨김', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    // 교정 불필요 선택
    await testOperatorPage.getByLabel('교정 필요 여부').selectOption('not_required');

    // 교정 주기 필드가 숨겨지는지 확인
    await expect(testOperatorPage.getByLabel('교정 주기')).not.toBeVisible();
  });
});

test.describe('Equipment Form - Error Handling', () => {
  test('네트워크 오류 시 ErrorAlert 표시', async ({ page }) => {
    // API 요청 차단
    await page.route('**/api/equipment', (route) => route.abort());

    await page.goto('/equipment/create');

    // 필수 필드 입력
    await page.getByLabel('장비명').fill('테스트 장비');
    await page.getByLabel('사이트').selectOption('suwon');

    // 저장
    await page.getByRole('button', { name: '저장' }).click();

    // ErrorAlert 표시 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });
});

test.describe('Equipment Form - Accessibility', () => {
  test('폼에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    const form = testOperatorPage.getByRole('form').or(testOperatorPage.locator('form'));
    await expect(form).toBeVisible();
  });

  test('키보드 탐색', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment/create');

    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts --project=chromium

# 에러 처리 테스트만 실행
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form-errors.spec.ts

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/equipment-form.spec.ts --debug
```

---

### Best Practice 개선 사항 (2026.01.24)

#### 1. 이력 일괄 저장 병렬화 (async-parallel)

**문제점**: 기존 `for` 루프로 순차 처리하면 네트워크 지연이 누적됨

```typescript
// ❌ 기존: O(n) 순차 실행 - 느림
for (let i = 0; i < pendingHistory.locationHistory.length; i++) {
  await equipmentApi.createLocationHistory(equipmentUuid, pendingHistory.locationHistory[i]);
}
```

**해결책**: `Promise.allSettled`로 병렬 처리

```typescript
// ✅ 개선: 모든 이력을 병렬로 저장 - 빠름
const saveResults = await Promise.all([
  ...locationPromises, // 위치 변동 이력
  ...maintenancePromises, // 유지보수 내역
  ...incidentPromises, // 손상/수리 내역
  ...calibrationPromises, // 교정 이력
]);
```

**효과**:

- 기존: 4개 이력 × 200ms 지연 = 800ms
- 개선: 병렬 실행 = 최대 200ms (가장 느린 요청 시간)

#### 2. tempId 기반 이력 관리 (Map 구조)

**문제점**: 배열 인덱스 기반 삭제 시 동기화 버그 발생

```typescript
// ❌ 기존: 인덱스 기반 삭제 - 버그 발생
const index = locationHistory.findIndex((item) => item.id === historyId);
setPendingLocationHistory((prev) => prev.filter((_, i) => i !== index));
// 문제: locationHistory와 pendingLocationHistory 인덱스가 일치하지 않을 수 있음
```

**해결책**: `tempId`를 키로 사용하여 직접 매칭

```typescript
// ✅ 개선: tempId 기반 삭제 - 안전함
interface PendingHistoryItem<T> {
  tempId: string;
  data: T;
}

// 추가 시 tempId 저장
setPendingLocationHistory((prev) => [...prev, { tempId, data }]);

// 삭제 시 tempId로 직접 매칭
setPendingLocationHistory((prev) => prev.filter((item) => item.tempId !== historyId));
```

**효과**:

- 순서에 관계없이 정확한 삭제 보장
- 여러 항목 연속 삭제 시에도 안전

#### 3. 타입 안전성 강화

**개선된 타입 정의**:

```typescript
// 이력 저장 결과 타입
interface HistorySaveResult {
  type: 'location' | 'maintenance' | 'incident' | 'calibration';
  index: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
}

// 임시 이력 항목 타입
interface PendingHistoryItem<T> {
  tempId: string;
  data: T;
}
```

---

### 참조된 스킬

- `/equipment-management` - 장비 관리 시스템 도메인 지식
- `/nextjs-16` - Next.js 16 패턴 (PageProps, useActionState 등)
- `/vercel-react-best-practices` - 성능 최적화 규칙 (async-parallel, bundle-dynamic-imports 등)
- `/web-design-guidelines` - 접근성 및 UI 가이드라인
