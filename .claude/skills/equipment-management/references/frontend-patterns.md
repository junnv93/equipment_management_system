# 프론트엔드 개발 패턴 (Next.js 16)

## 목차

1. [필수 규칙](#필수-규칙)
2. [페이지 패턴](#페이지-패턴)
3. [컴포넌트 패턴](#컴포넌트-패턴)
4. [API 호출 패턴](#api-호출-패턴)
5. [폼 처리 패턴](#폼-처리-패턴)
6. [승인 관리 페이지](#승인-관리-페이지)

---

## 필수 규칙

### 1. params는 Promise

```typescript
// ❌ 잘못된 패턴
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}

// ✅ 올바른 패턴
export default async function Page(props: PageProps<'/equipment/[id]'>) {
  const { id } = await props.params;
  return <div>{id}</div>;
}
```

### 2. useActionState 사용

```typescript
// ❌ 잘못된 패턴 (useFormState 사용)
import { useFormState } from 'react-dom';

// ✅ 올바른 패턴
import { useActionState } from 'react';
```

### 3. Form action은 void 반환

```typescript
// ❌ 잘못된 패턴 - 폼 액션에서 데이터 반환
export async function submitForm(formData: FormData) {
  'use server';
  return { success: true }; // 타입 에러!
}

// ✅ 올바른 패턴 - revalidation 사용
export async function submitForm(formData: FormData) {
  'use server';
  await saveData(formData);
  revalidatePath('/equipment');
  // void 반환
}
```

### 4. any 타입 금지

```typescript
// ❌ 잘못된 패턴
const data: any = await fetch(...);

// ✅ 올바른 패턴
interface Equipment {
  uuid: string;
  name: string;
  // ...
}
const data: Equipment[] = await fetch(...).then(r => r.json());
```

---

## 페이지 패턴

### 목록 페이지

```typescript
// apps/frontend/app/equipment/page.tsx
import { Suspense } from 'react';
import { EquipmentList } from '@/components/equipment/EquipmentList';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { getEquipmentList } from '@/lib/api/equipment-api';

interface SearchParams {
  site?: string;
  status?: string;
  page?: string;
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">장비 목록</h1>

      <EquipmentFilters
        currentSite={params.site}
        currentStatus={params.status}
      />

      <Suspense fallback={<div>로딩 중...</div>}>
        <EquipmentListWrapper params={params} />
      </Suspense>
    </div>
  );
}

async function EquipmentListWrapper({ params }: { params: SearchParams }) {
  const equipment = await getEquipmentList({
    site: params.site,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return <EquipmentList items={equipment.data} pagination={equipment.meta} />;
}
```

### 상세 페이지

```typescript
// apps/frontend/app/equipment/[id]/page.tsx
import { notFound } from 'next/navigation';
import { PageProps } from '@/types/next';
import { getEquipment } from '@/lib/api/equipment-api';
import { EquipmentDetail } from '@/components/equipment/EquipmentDetail';
import { NonConformanceBanner } from '@/components/equipment/NonConformanceBanner';

export default async function EquipmentDetailPage(
  props: PageProps<'/equipment/[id]'>
) {
  const { id } = await props.params;

  const equipment = await getEquipment(id);

  if (!equipment) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      {equipment.status === 'non_conforming' && (
        <NonConformanceBanner equipmentId={id} />
      )}

      <EquipmentDetail equipment={equipment} />
    </div>
  );
}

export async function generateMetadata(props: PageProps<'/equipment/[id]'>) {
  const { id } = await props.params;
  const equipment = await getEquipment(id);

  return {
    title: equipment?.name ?? '장비 상세',
  };
}
```

### 등록/수정 페이지

```typescript
// apps/frontend/app/equipment/create/page.tsx
'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createEquipment } from '@/lib/actions/equipment-actions';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';

export default function CreateEquipmentPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createEquipment, null);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">장비 등록</h1>

      {state?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      <p className="text-gray-600 mb-4">
        등록된 장비는 기술책임자 승인 후 시스템에 반영됩니다.
      </p>

      <form action={formAction}>
        <EquipmentForm />
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isPending ? '등록 중...' : '등록 요청'}
        </button>
      </form>
    </div>
  );
}
```

---

## 컴포넌트 패턴

### 상태 배지 컴포넌트

```typescript
// apps/frontend/components/shared/StatusBadge.tsx
interface StatusBadgeProps {
  status: string;
  type: 'equipment' | 'approval' | 'checkout';
}

const STATUS_CONFIG = {
  equipment: {
    available: { label: '사용가능', color: 'bg-green-100 text-green-800' },
    in_use: { label: '사용중', color: 'bg-blue-100 text-blue-800' },
    checked_out: { label: '반출중', color: 'bg-purple-100 text-purple-800' },
    calibration_scheduled: { label: '교정예정', color: 'bg-yellow-100 text-yellow-800' },
    calibration_overdue: { label: '교정기한초과', color: 'bg-red-100 text-red-800' },
    non_conforming: { label: '부적합', color: 'bg-red-100 text-red-800' },
    spare: { label: '여분', color: 'bg-slate-100 text-slate-800' },
    retired: { label: '폐기', color: 'bg-gray-100 text-gray-800' },
  },
  approval: {
    pending_approval: { label: '승인대기', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-800' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-800' },
  },
  checkout: {
    pending: { label: '대기', color: 'bg-gray-100 text-gray-800' },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-800' },
    checked_out: { label: '반출중', color: 'bg-purple-100 text-purple-800' },
    returned: { label: '반입완료', color: 'bg-yellow-100 text-yellow-800' },
    return_approved: { label: '반입승인', color: 'bg-green-100 text-green-800' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-800' },
    canceled: { label: '취소됨', color: 'bg-gray-100 text-gray-800' },
    overdue: { label: '기한초과', color: 'bg-red-100 text-red-800' },
  },
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = STATUS_CONFIG[type][status as keyof typeof STATUS_CONFIG[typeof type]];

  if (!config) {
    return <span className="px-2 py-1 rounded bg-gray-100">{status}</span>;
  }

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
```

### 파일 업로드 컴포넌트

```typescript
// apps/frontend/components/shared/FileUpload.tsx
'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  name: string;
  accept?: string;
  maxSize?: number; // MB
  required?: boolean;
  label: string;
}

export function FileUpload({
  name,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxSize = 10,
  required = false,
  label,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // 크기 검증 (MB → bytes)
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`파일 크기는 ${maxSize}MB 이하여야 합니다`);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={handleChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {file && (
        <p className="text-sm text-gray-600">
          선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
        </p>
      )}
    </div>
  );
}
```

### 역할 기반 UI 표시

```typescript
// apps/frontend/components/shared/RoleGuard.tsx
'use client';

import { useUser } from '@/hooks/useUser';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 사용 예시
<RoleGuard allowedRoles={['technical_manager', 'lab_manager']}>
  <button onClick={handleApprove}>승인</button>
</RoleGuard>
```

---

## API 호출 패턴

### API 함수 정의

```typescript
// apps/frontend/lib/api/equipment-api.ts
import { apiClient } from './client';

export interface Equipment {
  uuid: string;
  name: string;
  managementNumber: string;
  site: 'suwon' | 'uiwang';
  status: string;
  approvalStatus: string;
  // ...
}

export interface EquipmentListResponse {
  data: Equipment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getEquipmentList(params?: {
  site?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.site) searchParams.set('site', params.site);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const response = await apiClient.get(`/equipment?${searchParams}`);
  return response.data;
}

export async function getEquipment(uuid: string): Promise<Equipment | null> {
  try {
    const response = await apiClient.get(`/equipment/${uuid}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function approveEquipment(uuid: string): Promise<void> {
  await apiClient.patch(`/equipment/${uuid}/approve`);
}

export async function rejectEquipment(uuid: string, reason: string): Promise<void> {
  if (!reason || reason.length < 10) {
    throw new Error('반려 사유는 10자 이상 필수입니다');
  }
  await apiClient.patch(`/equipment/${uuid}/reject`, { reason });
}
```

### Server Action 정의

```typescript
// apps/frontend/lib/actions/equipment-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

interface FormState {
  error?: string;
  success?: boolean;
}

export async function createEquipment(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    const body = new FormData();

    // 필수 필드 추출 및 검증
    const name = formData.get('name') as string;
    const managementNumber = formData.get('managementNumber') as string;
    const site = formData.get('site') as string;

    if (!name || !managementNumber || !site) {
      return { error: '필수 항목을 모두 입력해주세요' };
    }

    body.append('name', name);
    body.append('managementNumber', managementNumber);
    body.append('site', site);
    // ... 기타 필드

    // 파일 첨부
    const attachmentFile = formData.get('attachmentFile') as File;
    if (attachmentFile && attachmentFile.size > 0) {
      body.append('attachmentFile', attachmentFile);
    }

    await apiClient.post('/equipment', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    revalidatePath('/equipment');
  } catch (error: any) {
    return {
      error: error.response?.data?.message || '등록에 실패했습니다',
    };
  }

  redirect('/equipment');
}
```

---

## 폼 처리 패턴

### useActionState 활용

```typescript
// apps/frontend/app/calibration/register/page.tsx
'use client';

import { useActionState } from 'react';
import { useUser } from '@/hooks/useUser';
import { createCalibration } from '@/lib/actions/calibration-actions';

export default function RegisterCalibrationPage() {
  const { user } = useUser();
  const [state, formAction, isPending] = useActionState(createCalibration, null);

  const isTechnicalOrHigher = ['technical_manager', 'lab_manager'].includes(user?.role || '');

  return (
    <form action={formAction}>
      {/* 공통 필드 */}
      <div className="space-y-4">
        <input type="text" name="calibrationDate" required />
        <input type="text" name="result" required />
      </div>

      {/* 기술책임자용: 코멘트 필수 */}
      {isTechnicalOrHigher && (
        <div className="mt-4">
          <label className="block text-sm font-medium">
            등록자 코멘트 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="registrarComment"
            required
            minLength={5}
            placeholder="검토 완료 내용을 입력하세요"
            className="mt-1 block w-full rounded border-gray-300"
          />
        </div>
      )}

      {/* 시험실무자용: 안내 메시지 */}
      {!isTechnicalOrHigher && (
        <div className="mt-4 p-4 bg-yellow-50 rounded">
          <p className="text-yellow-800">
            교정 기록은 기술책임자 승인 후 반영됩니다.
          </p>
        </div>
      )}

      {state?.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isPending ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
```

---

## 승인 관리 페이지

### 범용 승인 관리 페이지 패턴

```typescript
// apps/frontend/app/admin/[feature]-approvals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface PendingItem {
  uuid: string;
  name: string;
  requestedBy: { name: string };
  requestedAt: string;
}

interface ApprovalsPageProps {
  title: string;
  fetchPending: () => Promise<PendingItem[]>;
  onApprove: (uuid: string, comment: string) => Promise<void>;
  onReject: (uuid: string, reason: string) => Promise<void>;
  commentRequired?: boolean;
}

export function ApprovalsPage({
  title,
  fetchPending,
  onApprove,
  onReject,
  commentRequired = false,
}: ApprovalsPageProps) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await fetchPending();
    setItems(data);
    setLoading(false);
  };

  const handleApprove = async (uuid: string) => {
    if (commentRequired && !comment.trim()) {
      alert('승인 코멘트를 입력해주세요');
      return;
    }

    try {
      await onApprove(uuid, comment);
      await loadItems();
      setComment('');
      setSelectedItem(null);
    } catch (error) {
      alert('승인 처리에 실패했습니다');
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;

    if (!rejectReason || rejectReason.length < 10) {
      alert('반려 사유는 10자 이상 입력해주세요');
      return;
    }

    try {
      await onReject(selectedItem, rejectReason);
      await loadItems();
      setRejectReason('');
      setShowRejectModal(false);
      setSelectedItem(null);
    } catch (error) {
      alert('반려 처리에 실패했습니다');
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">승인 대기 중인 항목이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.uuid}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    요청자: {item.requestedBy.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    요청일: {new Date(item.requestedAt).toLocaleDateString()}
                  </p>
                </div>

                <StatusBadge status="pending_approval" type="approval" />
              </div>

              {/* 코멘트 입력 (commentRequired인 경우) */}
              {commentRequired && selectedItem === item.uuid && (
                <div className="mt-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="승인 코멘트를 입력하세요"
                    className="w-full border rounded p-2"
                    rows={2}
                  />
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedItem(item.uuid);
                    if (!commentRequired) {
                      handleApprove(item.uuid);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {commentRequired && selectedItem !== item.uuid ? '승인하기' : '승인'}
                </button>

                {commentRequired && selectedItem === item.uuid && (
                  <button
                    onClick={() => handleApprove(item.uuid)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    승인 확정
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedItem(item.uuid);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  반려
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">반려 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요 (10자 이상)"
              className="w-full border rounded p-2"
              rows={4}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 border rounded"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 교정 기록 승인 페이지 예시

```typescript
// apps/frontend/app/admin/calibration-approvals/page.tsx
'use client';

import { ApprovalsPage } from '@/components/admin/ApprovalsPage';
import {
  getPendingCalibrations,
  approveCalibration,
  rejectCalibration,
} from '@/lib/api/calibration-api';

export default function CalibrationApprovalsPage() {
  return (
    <ApprovalsPage
      title="교정 기록 승인 관리"
      fetchPending={getPendingCalibrations}
      onApprove={approveCalibration}
      onReject={rejectCalibration}
      commentRequired={true} // 교정 승인 시 코멘트 필수
    />
  );
}
```
