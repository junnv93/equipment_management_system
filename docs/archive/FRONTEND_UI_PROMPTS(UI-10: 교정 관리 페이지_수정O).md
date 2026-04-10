# 프론트엔드 UI 개발 프롬프트

> 📖 **공통 가이드라인**: [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md)를 먼저 참조하세요.
>
> - 스킬 참조, 역할 체계, Playwright 테스트 가이드
> - Next.js 16 패턴, 성능 최적화, 접근성 요구사항
> - API 호출 규칙, 에러 처리, 디자인 요구사항

---

## UI-10: 교정 관리 페이지

### 목적

교정 기록 등록 및 관리 페이지를 구현합니다. UL-QP-18 절차서에 따른 승인 워크플로우를 포함합니다.

---

### 4. 교정 관리

#### 4.1 교정 관리 권한

| 기능               | 시험실무자 | 기술책임자 | 품질책임자 | 시험소장 | 시스템관리자 |
| ------------------ | ---------- | ---------- | ---------- | -------- | ------------ |
| 교정 기록 등록     | ✓          | -          | -          | -        | -            |
| 교정 기록 승인     | -          | ✓          | -          | -        | -            |
| 중간점검 기록 등록 | ✓          | -          | -          | -        | -            |
| 중간점검 기록 승인 | -          | ✓          | -          | -        | -            |
| 자체점검 기록 등록 | ✓          | ✓          | -          | -        | -            |
| 연간 교정계획 작성 | -          | ✓          | -          | -        | -            |
| 연간 교정계획 검토 | -          | -          | ✓          | -        | -            |
| 연간 교정계획 승인 | -          | -          | -          | ✓        | -            |

> ⚠️ **교정 관리 특수 정책:**
>
> - 교정 기록 등록은 **시험실무자만** 가능합니다
> - 시험소장(lab_manager)도 교정 기록은 등록할 수 없습니다 (다른 기능과 다름)
> - 이는 등록/승인 분리 원칙을 엄격히 적용하기 위한 정책입니다
> - 모든 교정 기록은 기술책임자 이상의 승인이 필요합니다

**교정 관련 정보**

| 항목           | 필수   | 설명                     |
| -------------- | ------ | ------------------------ |
| 교정 필요 여부 | ✓      | Y/N                      |
| 교정 주기      | 조건부 | 교정 필요 시 필수 (개월) |
| 최근 교정일자  | 조건부 | 교정 필요 시             |
| 차기 교정일    | 조건부 | 자동 계산 또는 수동 입력 |
| 교정 결과      | 조건부 | 적합/부적합/조건부       |

#### 4.2 교정 기록 등록

##### 4.2.1 교정 기록 필수 항목

| 항목            | 필수 | 설명                                   | SSOT                    |
| --------------- | ---- | -------------------------------------- | ----------------------- |
| 대상 장비       | ✓    | 장비 선택 (equipmentId)                | -                       |
| 교정일자        | ✓    | 교정 수행일 (calibrationDate)          | -                       |
| 교정기관        | ✓    | 교정 수행 기관명 (calibrationAgency)   | -                       |
| 교정성적서 번호 | ✓    | 성적서 고유번호 (certificateNumber)    | -                       |
| 교정 결과       | ✓    | 적합/부적합/조건부 (calibrationResult) | `CalibrationResultEnum` |
| 차기 교정일     | ✓    | 다음 교정 예정일 (nextCalibrationDate) | -                       |
| 교정성적서 파일 | ✓    | PDF 등 파일 첨부 (certificatePath)     | -                       |
| 비고            | -    | 추가 사항 (notes)                      | -                       |

> ⚠️ **SSOT 필수**: 교정 결과는 반드시 `@equipment-management/schemas`의 `CalibrationResultEnum`을 사용합니다.

##### 4.2.2 교정 기록 등록 프로세스

```
┌─────────────────────────────────────────────────────────────┐
│                  교정 기록 등록 프로세스                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [시험실무자]                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                           │
│  │ 교정 기록    │  - 필수 항목 입력                          │
│  │ 등록        │  - 교정성적서 첨부                          │
│  └──────┬──────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  [기술책임자]                                                │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │ 검토 및 승인 │  - 교정 결과 확인                          │
│  │             │  - 성적서 검토                              │
│  └──────┬──────┘                                           │
│         │                                                   │
│    ┌────┴────┐                                             │
│    ▼         ▼                                             │
│ [승인]     [반려]                                           │
│    │         │                                             │
│    ▼         └→ 반려 사유와 함께 재등록 요청                 │
│ 교정 기록 확정                                               │
│ - 장비 교정일자 자동 업데이트 (lastCalibrationDate)           │
│ - 차기 교정일 자동 업데이트 (nextCalibrationDate)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 프롬프트

````
스킬 로드:
/equipment-management
/nextjs-16
/vercel-react-best-practices
/web-design-guidelines
/frontend-design
/playwright-skill
AGENTS.md와 /docs/development/API_STANDARDS.md를 참조하여 교정 관리 페이지를 구현해줘.

⚠️ SSOT 필수:
- CalibrationResultEnum: @equipment-management/schemas에서 import
- 값: 'pass' | 'fail' | 'conditional' (소문자)
- 라벨: CALIBRATION_RESULT_LABELS 사용

역할 참고:
- test_engineer: 교정 기록 등록 (승인 필요)
- technical_manager: 승인 권한만 (등록 불가)
- lab_manager: 모든 권한 (자체 승인 가능)

요구사항:
1. 교정 목록 페이지
   - 교정 기록 목록 테이블
   - 필터: 장비, 기간, 상태, 교정방법
   - 정렬: 교정일, 등록일
   - 페이지네이션

2. 교정 등록 (장비 상세 페이지의 CalibrationHistoryTab)
   - 필수 항목 모두 입력:
     - 교정일, 차기교정일 (자동 계산)
     - 교정기관
     - 교정성적서 번호 ⭐ 신규
     - 교정결과 (SSOT: CalibrationResultEnum)
     - 교정성적서 파일 첨부 ⭐ 신규
   - 역할별 UI 분기
     - 기술책임자: 등록자 코멘트 필수, 자동 승인
     - 시험실무자: "승인 대기 상태로 등록됩니다" 안내
   - 승인 시 장비 자동 업데이트:
     - equipment.lastCalibrationDate = calibration.calibrationDate
     - equipment.nextCalibrationDate = calibration.nextCalibrationDate

3. 교정 상세/수정
   - 교정 기록 상세 보기
   - 승인 상태 표시
   - 교정성적서 파일 다운로드
   - 수정 기능 (pending 상태에서만)

4. 중간점검 관리
   - 중간점검일 표시
   - 점검 예정 알림 목록

파일:
- apps/frontend/app/(dashboard)/calibration/page.tsx (목록)
- apps/frontend/app/(dashboard)/calibration/register/page.tsx (등록)
- apps/frontend/components/equipment/CalibrationHistoryTab.tsx ⭐ 주요 수정 대상
- apps/frontend/lib/api/calibration-api.ts
- packages/schemas/src/enums.ts (CalibrationResultEnum SSOT)

Next.js 16 필수 패턴:
1. 동적 라우트 페이지 (PageProps + await params):
   ```typescript
   // apps/frontend/app/calibration/[id]/page.tsx
   import { PageProps } from 'next';

   export default async function CalibrationDetailPage(
     props: PageProps<'/calibration/[id]'>
   ) {
     const { id } = await props.params;  // ✅ params는 Promise
     const calibration = await getCalibration(id);
     return <CalibrationDetailClient calibration={calibration} />;
   }
````

2. searchParams Promise 패턴 (목록 페이지):

   ```typescript
   // apps/frontend/app/calibration/page.tsx
   export default async function CalibrationListPage(props: {
     searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
   }) {
     const searchParams = await props.searchParams;
     const page = searchParams.page ?? '1';
     const status = searchParams.status;
     const method = searchParams.method;

     return <CalibrationListClient
       initialPage={page}
       initialStatus={status}
       initialMethod={method}
     />;
   }
   ```

3. useActionState 폼 처리:

   ```typescript
   'use client';
   import { useActionState } from 'react';
   import { createCalibration } from '@/app/actions/calibration';

   export function CalibrationForm() {
     const [state, formAction, isPending] = useActionState(
       createCalibration,
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

1. **bundle-dynamic-imports**: EquipmentSelector 동적 로딩

   ```typescript
   const EquipmentSelector = dynamic(() => import('./EquipmentSelector'), {
     loading: () => <Skeleton className="h-10 w-full" />,
     ssr: false
   });
   ```

2. **async-parallel**: 초기 데이터 병렬 로딩

   ```typescript
   const [equipment, methods, statuses] = await Promise.all([
     getEquipmentList(),
     getCalibrationMethods(),
     getCalibrationStatuses(),
   ]);
   ```

3. **rerender-memo**: 목록 아이템 컴포넌트 메모이제이션

   ```typescript
   const MemoizedCalibrationRow = memo(CalibrationRow);
   ```

4. **server-serialization**: 클라이언트로 전달되는 데이터 최소화
   - 목록에서 필요한 필드만 선택적으로 전달
   - Date 객체는 ISO 문자열로 직렬화

디자인 요구사항 (/frontend-design 스킬 활용):

- 결과별 색상 (UL Solutions 브랜드):
  - 합격: UL Green (#00A451) 배경
  - 부적합: Brand Red (#CA0123) 배경
  - 조건부합격: UL Orange (#FF9D55) 배경
- 역할별 안내 배너:
  - test_engineer: Info 배너 (UL Info #BCE4F7 배경)
  - technical_manager: Warning 배너 (UL Orange #FF9D55 테두리)
- 장비 선택 검색 드롭다운:
  - Combobox 패턴 적용
  - 선택된 장비 명확히 표시
  - 검색 결과 없음 상태 처리
- 테이블 디자인:
  - 행 hover 효과 (#F5F5F5)
  - 상태별 뱃지 색상 적용
  - 정렬 가능 컬럼 표시 (화살표 아이콘)

접근성 요구사항 (/web-design-guidelines):

- 테이블에 role="grid" 및 aria-label 추가
- 결과 라디오 그룹에 role="radiogroup" + aria-labelledby 추가
- 장비 선택에 role="combobox" + aria-expanded 추가
- 로딩/에러 상태에 aria-live="polite" 추가
- 결과 뱃지에 aria-label 추가 (색맹 사용자 대응)
- 필터 변경 시 결과 영역에 aria-live="polite" 적용
- 키보드로 테이블 행 탐색 가능 (Arrow keys)

제약사항:

- 기술책임자 등록 시 registrarComment 필수
- 결과가 '부적합'인 경우 장비 상태 자동 변경 안내

검증:

- 역할별 등록 플로우 테스트
- 필수 필드 검증 테스트
- pnpm tsc --noEmit

Playwright 테스트:

- 역할별 UI 분기 확인
- 교정 등록 성공/실패 확인
- 목록 필터 동작 확인

완료 후 체크리스트의 [ ]를 [x]로 변경해주세요.

````

---

### 필수 가이드라인

#### 1. 교정 관련 API 엔드포인트

```typescript
// 목록 조회
GET /api/calibration?equipmentId={id}&startDate={date}&endDate={date}&status={status}&method={method}

// 장비별 교정 이력 조회
GET /api/calibration/equipment/:equipmentId

// 상세 조회
GET /api/calibration/:uuid

// 교정 등록 (승인 필요 여부는 역할에 따라 결정)
POST /api/calibration
// Body: { equipmentId, calibrationDate, nextCalibrationDate, calibrationAgency,
//         certificateNumber, calibrationResult, calibrationCycle, notes }

// 교정 수정 (pending 상태에서만 가능)
PATCH /api/calibration/:uuid

// 교정 승인 (기술책임자 이상) - 장비 자동 업데이트 포함
PATCH /api/calibration/:uuid/approve
// Body: { approverId, approverComment }
// 효과: equipment.lastCalibrationDate, equipment.nextCalibrationDate 자동 업데이트

// 교정 반려 (기술책임자 이상)
PATCH /api/calibration/:uuid/reject
// Body: { approverId, rejectionReason }

// 교정성적서 파일 업로드 ⭐ 신규
POST /api/calibration/:uuid/certificate
// Body: FormData with 'file' field
// Response: { filePath: string }
````

---

#### 2. 역할별 UI 분기 - 교정 관리 특화

```typescript
'use client'
import { useAuth } from '@/hooks/use-auth';

export function CalibrationForm() {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();

  if (isLoading) return <FormSkeleton />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // 역할 기반 UI 분기 - 교정 관리 특화
  const isTechnicalManager = hasRole('technical_manager');
  const canDirectRegister = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const canApprove = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const needsApproval = hasRole('test_engineer');

  return (
    <>
      {/* 시험실무자: 승인 필요 안내 */}
      {needsApproval && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            시험실무자가 등록한 교정 기록은 기술책임자의 승인이 필요합니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 기술책임자: 코멘트 필수 안내 */}
      {isTechnicalManager && (
        <Alert className="mb-4 border-yellow-500">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            기술책임자 직접 등록 시 등록자 코멘트는 필수입니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 폼 내용 */}
    </>
  );
}
```

---

#### 3. 교정 결과별 UI 처리

**배경**: 교정 결과에 따라 장비 상태 변경 및 추가 안내가 필요함

**⚠️ SSOT 필수**: 반드시 `@equipment-management/schemas`에서 import하여 사용

```typescript
// ✅ SSOT import (필수)
import {
  CalibrationResultEnum,
  CALIBRATION_RESULT_LABELS,
  type CalibrationResult,
} from '@equipment-management/schemas';

// CalibrationResultEnum.options = ['pass', 'fail', 'conditional']
// CALIBRATION_RESULT_LABELS = { pass: '적합', fail: '부적합', conditional: '조건부 적합' }
```

**결과별 색상 및 처리 (UL Solutions 브랜드 적용)**:

```typescript
// UL Solutions 브랜드 색상 적용 - SSOT 값 사용 (소문자)
const RESULT_CONFIG: Record<CalibrationResult, ResultConfig> = {
  pass: {  // ✅ SSOT: 'pass' (소문자)
    // UL Green: #00A451
    color: 'bg-[#00A451]/10 text-[#00A451] border-[#00A451]/20',
    icon: CheckCircle2,
    label: CALIBRATION_RESULT_LABELS.pass,  // '적합'
    description: '교정 기준을 충족합니다.',
    ariaLabel: '교정 결과: 적합',
  },
  fail: {  // ✅ SSOT: 'fail' (소문자)
    // Brand Red: #CA0123
    color: 'bg-[#CA0123]/10 text-[#CA0123] border-[#CA0123]/20',
    icon: XCircle,
    label: CALIBRATION_RESULT_LABELS.fail,  // '부적합'
    description: '교정 기준을 충족하지 못합니다. 장비 상태가 "부적합"으로 변경됩니다.',
    warning: true,
    ariaLabel: '교정 결과: 부적합 - 장비 사용 중지 필요',
  },
  conditional: {  // ✅ SSOT: 'conditional' (소문자)
    // UL Orange: #FF9D55
    color: 'bg-[#FF9D55]/10 text-[#FF9D55] border-[#FF9D55]/20',
    icon: AlertTriangle,
    label: CALIBRATION_RESULT_LABELS.conditional,  // '조건부 적합'
    description: '특정 조건 하에서만 사용 가능합니다. 조건을 명시해주세요.',
    ariaLabel: '교정 결과: 조건부 적합 - 사용 조건 확인 필요',
  },
};

// 교정 결과 Select - SSOT enum 사용
<Select onValueChange={field.onChange} defaultValue={field.value}>
  <SelectContent>
    {CalibrationResultEnum.options.map((value) => (
      <SelectItem key={value} value={value}>
        {CALIBRATION_RESULT_LABELS[value]}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// 결과 선택 시 경고 표시 - SSOT 값 사용
{selectedResult === 'fail' && (  // ✅ 'fail' (소문자)
  <Alert variant="destructive" className="mt-4">
    <XCircle className="h-4 w-4" />
    <AlertTitle>장비 상태 변경 안내</AlertTitle>
    <AlertDescription>
      부적합 결과 등록 시 해당 장비의 상태가 자동으로 "부적합(사용중지)"으로 변경됩니다.
      장비에 사용중지 식별표를 부착해주세요.
    </AlertDescription>
  </Alert>
)}
```

---

#### 4. 기술책임자 코멘트 필수 검증

```typescript
// 기술책임자 등록 시 registrarComment 필수 검증
if (isTechnicalManager && !data.registrarComment) {
  form.setError('registrarComment', {
    type: 'required',
    message: '기술책임자는 등록 시 코멘트를 필수로 입력해야 합니다',
  });
  return;
}
```

---

#### 5. 교정성적서 번호 및 파일 첨부 (신규)

##### 5.1 폼 스키마 업데이트

```typescript
import { CalibrationResultEnum } from '@equipment-management/schemas';

const calibrationSchema = z.object({
  calibrationDate: z.string().min(1, '교정일을 입력하세요'),
  nextCalibrationDate: z.string().min(1, '다음 교정일을 입력하세요'),
  calibrationAgency: z.string().min(1, '교정 기관을 입력하세요').max(100),
  certificateNumber: z.string().min(1, '교정성적서 번호를 입력하세요'), // ⭐ 신규 필수
  calibrationCycle: z.coerce.number().min(1, '교정 주기를 입력하세요 (최소 1개월)'),
  calibrationResult: CalibrationResultEnum, // ✅ SSOT 사용
  notes: z.string().optional(),
});
```

##### 5.2 파일 업로드 UI

```typescript
// 파일 상태 관리
const [certificateFile, setCertificateFile] = useState<File | null>(null);

// 폼 필드
<FormItem>
  <FormLabel>교정성적서 번호 *</FormLabel>
  <FormControl>
    <Input placeholder="예: CAL-2026-0001" {...field} />
  </FormControl>
  <FormMessage />
</FormItem>

<FormItem>
  <FormLabel>교정성적서 파일 *</FormLabel>
  <Input
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
  />
  <FormDescription>PDF 또는 이미지 파일 (최대 10MB)</FormDescription>
  {!certificateFile && (
    <p className="text-sm text-destructive">교정성적서 파일을 첨부해주세요</p>
  )}
</FormItem>
```

##### 5.3 제출 시 파일 검증

```typescript
const handleSubmit = async (data: CalibrationFormData) => {
  // 파일 필수 검증
  if (!certificateFile) {
    toast({
      title: '파일 필요',
      description: '교정성적서 파일을 첨부해주세요.',
      variant: 'destructive',
    });
    return;
  }

  // 1. 교정 기록 생성
  const calibration = await createMutation.mutateAsync({
    equipmentId,
    ...data,
  });

  // 2. 파일 업로드
  if (calibration?.id && certificateFile) {
    await calibrationApi.uploadCertificate(calibration.id, certificateFile);
  }

  // 성공 처리
  toast({ title: '교정 이력 등록 완료' });
};
```

---

#### 6. 승인 시 장비 자동 업데이트

**백엔드 로직** (CalibrationService.approveCalibration):

```typescript
async approveCalibration(id: string, approveDto: ApproveCalibrationDto) {
  // 1. 교정 기록 승인 처리
  const calibration = await this.approveRecord(id, approveDto);

  // 2. 장비 교정일 자동 업데이트 ⭐ 핵심
  await this.db
    .update(equipment)
    .set({
      lastCalibrationDate: calibration.calibrationDate,
      nextCalibrationDate: calibration.nextCalibrationDate,
      updatedAt: new Date(),
    })
    .where(eq(equipment.id, calibration.equipmentId));

  return calibration;
}
```

**프론트엔드 처리**:

- 승인 후 equipment 쿼리 무효화하여 최신 상태 반영
- 장비 상세 페이지에서 업데이트된 교정일 표시

```typescript
// 승인 후 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
queryClient.invalidateQueries({ queryKey: ['calibrations', 'equipment', equipmentId] });
```

---

### 이행 체크리스트 UI-10

#### SSOT 준수 (필수)

- [ ] CalibrationResultEnum을 packages/schemas에서 import
- [ ] CALIBRATION_RESULT_LABELS 사용 (로컬 상수 제거)
- [ ] 교정 결과 값이 소문자 ('pass', 'fail', 'conditional') 사용됨

#### 필수 항목 구현

- [ ] 교정성적서 번호 (certificateNumber) 필드 추가됨
- [ ] 교정성적서 파일 업로드 기능 구현됨
- [ ] 파일 필수 검증 로직 구현됨
- [ ] 승인 시 장비 자동 업데이트 구현됨 (lastCalibrationDate, nextCalibrationDate)

#### 컴포넌트 구현

- [ ] (dashboard)/calibration/page.tsx 구현됨
- [ ] (dashboard)/calibration/register/page.tsx 구현됨
- [ ] CalibrationHistoryTab.tsx 업데이트됨 (주요 수정 대상)
- [ ] calibration-api.ts API 함수 업데이트됨
- [ ] uploadCertificate API 함수 추가됨

#### Next.js 16 패턴

- [ ] 동적 라우트에서 PageProps 사용됨
- [ ] params를 await로 처리함
- [ ] searchParams를 await로 처리함 (목록 페이지)
- [ ] useActionState 사용됨 (useFormState 아님)
- [ ] Server Actions가 적절히 분리됨

#### 성능 최적화 (Vercel Best Practices)

- [ ] EquipmentSelector 동적 import 적용됨
- [ ] 목록 행 컴포넌트 메모이제이션됨
- [ ] 초기 데이터 Promise.all로 병렬 로딩됨
- [ ] 클라이언트로 전달되는 데이터 최소화됨

#### 기능 구현

- [ ] 역할별 UI 분기 구현됨
- [ ] 기술책임자 코멘트 필수 검증됨
- [ ] 결과별 색상 표시 구현됨 (UL Solutions 브랜드)
- [ ] 부적합 결과 시 장비 상태 변경 안내 구현됨
- [ ] 필터 및 정렬 구현됨 (URL 상태 동기화)
- [ ] 페이지네이션 구현됨

#### 에러 처리 관련

- [ ] useQuery error 상태 처리 구현됨
- [ ] ErrorAlert 컴포넌트 연동됨
- [ ] 재시도 버튼(onRetry) 구현됨
- [ ] 401 응답 시 로그인 페이지 리다이렉트 확인됨
- [ ] 필드별 에러 표시 구현됨

#### 로딩/빈 상태 관련

- [ ] 목록 스켈레톤 로딩 UI 구현됨
- [ ] 폼 스켈레톤 로딩 UI 구현됨
- [ ] 빈 상태 UI 구현됨 (검색 결과 없음)
- [ ] 빈 상태 UI 구현됨 (데이터 없음)
- [ ] 적용된 필터 Badge 표시됨
- [ ] 필터 초기화 기능 구현됨

#### form 버튼 관련

- [ ] Dialog 내 모든 Button에 type 속성 명시됨
- [ ] form 내 취소/선택 버튼에 type="button" 적용됨
- [ ] 제출 버튼에만 type="submit" 적용됨

#### 접근성 관련 (WCAG 2.1 AA)

- [ ] 테이블에 role="grid" 및 aria-label 추가됨
- [ ] 결과 라디오 그룹에 role="radiogroup" + aria-labelledby 추가됨
- [ ] 장비 선택에 role="combobox" + aria-expanded 추가됨
- [ ] 로딩/에러 상태에 aria-live="polite" 추가됨
- [ ] 결과 뱃지에 aria-label 추가됨 (색맹 사용자 대응)
- [ ] 필터 변경 시 결과 영역에 aria-live="polite" 적용됨
- [ ] 키보드로 테이블 행 탐색 가능함 (Arrow keys)
- [ ] 모든 입력 필드에 명시적 label 연결됨
- [ ] 포커스 표시 명확함 (outline 스타일 유지)
- [ ] Tab 키 네비게이션 테스트 통과됨

#### 테스트

- [ ] Playwright 테스트 작성됨 (calibration.spec.ts)
- [ ] 에러 시나리오 테스트 통과됨
- [ ] 모든 테스트 통과됨

---

### Playwright 테스트 예시

```typescript
// tests/e2e/calibration.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Calibration List', () => {
  test('교정 기록 목록 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('필터 적용 및 URL 상태', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    await testOperatorPage.getByLabel('상태').selectOption('approved');
    await expect(testOperatorPage).toHaveURL(/status=approved/);
  });
});

test.describe('Calibration Register - Role Based UI', () => {
  test('시험실무자 - 승인 필요 안내 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    await expect(testOperatorPage.getByText(/승인이 필요합니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 필수 안내 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    await expect(techManagerPage.getByText(/코멘트는 필수입니다/)).toBeVisible();
  });

  test('기술책임자 - 코멘트 없이 제출 시 에러', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/register');

    await techManagerPage.getByRole('button', { name: '장비 선택' }).click();
    await techManagerPage.getByRole('option').first().click();

    await techManagerPage.getByLabel('교정일').fill('2025-01-15');
    await techManagerPage.getByLabel('차기교정일').fill('2026-01-15');
    await techManagerPage.getByRole('radio', { name: '합격' }).click();

    await techManagerPage.getByRole('button', { name: '저장' }).click();

    await expect(techManagerPage.getByText(/코멘트를 필수로 입력해야 합니다/)).toBeVisible();
  });

  test('결과 "부적합" 선택 시 경고 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    // SSOT: '부적합' 라벨 사용 (값은 'fail')
    await testOperatorPage.getByRole('radio', { name: '부적합' }).click();

    await expect(testOperatorPage.getByText(/장비 상태 변경 안내/)).toBeVisible();
  });

  test('교정성적서 파일 없이 제출 시 에러', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/register');

    // 필수 필드 입력
    await testOperatorPage.getByLabel('교정일').fill('2026-01-15');
    await testOperatorPage.getByLabel('교정 기관').fill('KRISS');
    await testOperatorPage.getByLabel('교정성적서 번호').fill('CAL-2026-0001');
    await testOperatorPage.getByRole('radio', { name: '적합' }).click();

    // 파일 첨부 없이 제출
    await testOperatorPage.getByRole('button', { name: '저장' }).click();

    await expect(testOperatorPage.getByText(/교정성적서 파일을 첨부해주세요/)).toBeVisible();
  });
});

test.describe('Calibration - Error Handling', () => {
  test('API 에러 시 ErrorAlert 표시', async ({ page }) => {
    await page.route('**/api/calibrations**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/calibration');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('빈 결과 시 빈 상태 UI 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration?equipmentId=non-existent');

    await expect(testOperatorPage.getByText('검색 결과가 없습니다')).toBeVisible();
    await expect(testOperatorPage.getByRole('button', { name: '필터 초기화' })).toBeVisible();
  });
});

test.describe('Calibration - Accessibility', () => {
  test('테이블에 적절한 ARIA 속성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    const table = testOperatorPage.getByRole('grid').or(testOperatorPage.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('키보드 탐색 가능', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration');

    await testOperatorPage.keyboard.press('Tab');
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Calibration Detail - Approval', () => {
  test('기술책임자 - 승인 버튼 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration/pending-record-id');

    await expect(techManagerPage.getByRole('button', { name: '승인' })).toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반려' })).toBeVisible();
  });

  test('시험실무자 - 승인 버튼 미표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/calibration/pending-record-id');

    await expect(testOperatorPage.getByRole('button', { name: '승인' })).not.toBeVisible();
  });

  test('승인 시 장비 교정일 자동 업데이트', async ({ techManagerPage }) => {
    // 1. 교정 기록 승인
    await techManagerPage.goto('/admin/calibration-approvals');
    await techManagerPage.getByRole('row').first().click();
    await techManagerPage.getByLabel('승인 코멘트').fill('검토 완료');
    await techManagerPage.getByRole('button', { name: '승인' }).click();

    // 2. 장비 상세 페이지에서 교정일 업데이트 확인
    await techManagerPage.goto('/equipment/equipment-uuid');
    await expect(techManagerPage.getByText('최근 교정일')).toBeVisible();
    // 교정일이 방금 승인한 날짜로 업데이트되었는지 확인
  });
});
```

#### 테스트 실행 방법

```bash
cd apps/frontend
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --project=chromium

# 디버그 모드
NODE_ENV=test pnpm exec playwright test tests/e2e/calibration.spec.ts --debug
```
