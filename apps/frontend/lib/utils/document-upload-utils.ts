import { QueryClient } from '@tanstack/react-query';
import { documentApi } from '@/lib/api/document-api';
import { queryKeys } from '@/lib/api/query-config';
import { DocumentTypeValues } from '@equipment-management/schemas';

export interface DocumentUploadFiles {
  photos: File[];
  manuals: File[];
}

export interface DocumentUploadResult {
  total: number;
  succeeded: number;
  failed: number;
}

/**
 * 장비 문서(사진/매뉴얼) 업로드 + 캐시 무효화 유틸리티
 *
 * SSOT:
 * - DocumentTypeValues 상수 사용 (문자열 하드코딩 방지)
 * - queryKeys.documents 팩토리로 캐시 무효화
 *
 * 설계:
 * - Promise.allSettled로 개별 파일 실패가 전체를 중단하지 않음
 * - 결과를 반환하여 호출자가 부분 실패를 사용자에게 알릴 수 있음
 * - 업로드 후 documents 캐시 무효화 (stale 데이터 방지)
 */
export async function uploadEquipmentDocuments(
  documentFiles: DocumentUploadFiles,
  ownerId: string,
  ownerKey: 'equipmentId' | 'requestId',
  queryClient: QueryClient
): Promise<DocumentUploadResult> {
  const uploads: Promise<unknown>[] = [];

  for (const photo of documentFiles.photos) {
    uploads.push(
      documentApi.uploadDocument(photo, DocumentTypeValues.EQUIPMENT_PHOTO, {
        [ownerKey]: ownerId,
      })
    );
  }

  for (const manual of documentFiles.manuals) {
    uploads.push(
      documentApi.uploadDocument(manual, DocumentTypeValues.EQUIPMENT_MANUAL, {
        [ownerKey]: ownerId,
      })
    );
  }

  if (uploads.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const results = await Promise.allSettled(uploads);

  const failed = results.filter((r) => r.status === 'rejected').length; // eslint-disable-line no-restricted-syntax -- Promise.allSettled result status; self-audit-exception
  const succeeded = results.length - failed;

  // 캐시 무효화: 업로드 성공이 1건이라도 있으면 documents 캐시 갱신
  if (succeeded > 0 && ownerKey === 'equipmentId') {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.documents.byEquipment(ownerId),
    });
  }

  return { total: results.length, succeeded, failed };
}
