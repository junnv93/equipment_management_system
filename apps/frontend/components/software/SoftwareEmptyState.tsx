'use client';

import { Package, FileCheck, Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/EmptyState';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';

/**
 * 소프트웨어 도메인 EmptyState 도메인 wrapper.
 *
 * `EmptyState` SSOT(`components/shared/EmptyState.tsx`)를 재사용하며 도메인별 i18n 키와
 * 권한 체크(`useAuth().can()`)를 캡슐화. CheckoutEmptyState / EquipmentEmptyState 패턴 추종.
 *
 * **DESIGN_REVIEW.md P1-4 해결**: 빈 상태가 아이콘 + 한 줄 텍스트만 → CTA 버튼 포함.
 */

// ============================================================================
// 1. 시험용 소프트웨어 목록 빈 상태 — UL-QP-18-07
// ============================================================================

export function TestSoftwareEmptyState() {
  const t = useTranslations('software');
  const { can } = useAuth();
  const canCreate = can(Permission.CREATE_TEST_SOFTWARE);

  return (
    <EmptyState
      variant="no-data"
      icon={Package}
      title={t('list.emptyState.title')}
      description={t('list.emptyState.description')}
      primaryAction={{
        label: t('list.emptyState.cta'),
        href: FRONTEND_ROUTES.SOFTWARE.CREATE,
      }}
      canAct={canCreate}
      className="py-16"
      testId="test-software-empty-state"
    />
  );
}

// ============================================================================
// 2. 유효성 확인 목록 빈 상태 — UL-QP-18-09
// ============================================================================

interface ValidationEmptyStateProps {
  /** 소프트웨어 상세 페이지에서 호출 시 cta href 변경용 */
  readonly softwareId?: string;
  /** CTA 버튼 클릭 핸들러 (모달 오픈 등) — href 미사용 시 */
  readonly onCreateClick?: () => void;
  /** 권한 체크 — 외부에서 결정 (제출자만 생성 가능) */
  readonly canCreate?: boolean;
}

export function ValidationListEmptyState({
  onCreateClick,
  canCreate = true,
}: ValidationEmptyStateProps) {
  const t = useTranslations('software');

  return (
    <EmptyState
      variant="no-data"
      icon={FileCheck}
      title={t('validation.emptyState.title')}
      description={t('validation.emptyState.description')}
      primaryAction={
        onCreateClick
          ? { label: t('validation.emptyState.cta'), onClick: onCreateClick }
          : undefined
      }
      canAct={canCreate}
      className="py-16"
      testId="validation-list-empty-state"
    />
  );
}

// ============================================================================
// 3. 첨부 문서 빈 상태 (DocumentTable / ValidationDocumentsSection)
// ============================================================================

interface DocumentsEmptyStateProps {
  /** 업로드 핸들러 (없으면 CTA 미노출) */
  readonly onUploadClick?: () => void;
  readonly canUpload?: boolean;
}

export function ValidationDocumentsEmptyState({
  onUploadClick,
  canUpload = true,
}: DocumentsEmptyStateProps) {
  const t = useTranslations('software');

  return (
    <EmptyState
      variant="no-data"
      icon={Paperclip}
      title={t('validation.documents.empty')}
      description={t('validation.documents.emptyDescription')}
      primaryAction={
        onUploadClick
          ? { label: t('validation.documents.upload'), onClick: onUploadClick }
          : undefined
      }
      canAct={canUpload}
      className="py-10"
      testId="validation-documents-empty-state"
    />
  );
}
