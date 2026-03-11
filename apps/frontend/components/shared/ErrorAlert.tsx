'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogIn,
  ExternalLink,
  X,
  Lightbulb,
} from 'lucide-react';
import {
  ApiError,
  EquipmentErrorCode,
  ErrorInfo,
  ERROR_MESSAGES,
  isRetryableError,
  isAuthError,
} from '@/lib/errors/equipment-errors';
import { formatDate } from '@/lib/utils/date';

/**
 * ErrorAlert 컴포넌트 Props
 */
interface ErrorAlertProps {
  /** 에러 객체 (ApiError 또는 일반 Error) */
  error: ApiError | Error | null;
  /** 에러 제목 (기본값: 에러 타입별 제목) */
  title?: string;
  /** 에러 메시지 (기본값: 에러 객체의 메시지) */
  message?: string;
  /** 재시도 콜백 */
  onRetry?: () => void;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 상세 정보 표시 여부 */
  showDetails?: boolean;
  /** 해결 방법 표시 여부 */
  showSolutions?: boolean;
  /** 컴포넌트 클래스 */
  className?: string;
}

/**
 * 에러 심각도별 스타일
 */
const severityStyles = {
  error: {
    variant: 'destructive' as const,
    icon: AlertCircle,
    bgClass: 'bg-brand-critical/10 border-brand-critical/20',
    iconClass: 'text-brand-critical',
    titleClass: 'text-brand-critical',
  },
  warning: {
    variant: 'default' as const,
    icon: AlertTriangle,
    bgClass: 'bg-brand-warning/10 border-brand-warning/20',
    iconClass: 'text-brand-warning',
    titleClass: 'text-brand-warning',
  },
  info: {
    variant: 'default' as const,
    icon: Info,
    bgClass: 'bg-brand-info/10 border-brand-info/20',
    iconClass: 'text-brand-info',
    titleClass: 'text-brand-info',
  },
};

/**
 * 에러 정보를 가져오는 함수
 */
function getErrorInfo(error: ApiError | Error | null): {
  info: ErrorInfo;
  apiError?: ApiError;
} {
  if (!error) {
    return {
      info: ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR],
    };
  }

  if (error instanceof ApiError) {
    return {
      info: error.getErrorInfo(),
      apiError: error,
    };
  }

  // 일반 Error의 경우 메시지 기반으로 추정
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return {
      info: ERROR_MESSAGES[EquipmentErrorCode.NETWORK_ERROR],
    };
  }

  if (message.includes('timeout')) {
    return {
      info: ERROR_MESSAGES[EquipmentErrorCode.TIMEOUT_ERROR],
    };
  }

  if (message.includes('unauthorized') || message.includes('인증')) {
    return {
      info: ERROR_MESSAGES[EquipmentErrorCode.UNAUTHORIZED],
    };
  }

  if (message.includes('forbidden') || message.includes('권한')) {
    return {
      info: ERROR_MESSAGES[EquipmentErrorCode.PERMISSION_DENIED],
    };
  }

  return {
    info: {
      ...ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR],
      message: error.message,
    },
  };
}

/**
 * 상세 에러 정보를 표시하는 컴포넌트
 *
 * - 에러 유형별 아이콘 및 색상
 * - 해결 방법 표시
 * - 액션 버튼 (재시도, 로그인, 관리자 문의 등)
 * - 접을 수 있는 상세 정보 섹션
 */
export function ErrorAlert({
  error,
  title,
  message,
  onRetry,
  onDismiss,
  showDetails = true,
  showSolutions = true,
  className = '',
}: ErrorAlertProps) {
  const router = useRouter();
  const t = useTranslations('common.errors');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!error) return null;

  const { info, apiError } = getErrorInfo(error);
  const style = severityStyles[info.severity];
  const Icon = style.icon;

  // 표시할 제목과 메시지
  const displayTitle = title || info.title;
  const displayMessage = message || (apiError ? apiError.getUserMessage() : error.message);

  // 재시도 가능 여부
  const canRetry = onRetry && isRetryableError(error);

  // 인증 에러 여부
  const isAuth = isAuthError(error);

  // 액션 버튼 렌더링
  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    // 재시도 버튼
    if (canRetry || onRetry) {
      actions.push(
        <Button key="retry" variant="outline" size="sm" onClick={onRetry} className="gap-1">
          <RefreshCw className="h-3 w-3" />
          {t('tryAgain')}
        </Button>
      );
    }

    // 로그인 버튼 (인증 에러 시)
    if (isAuth) {
      actions.push(
        <Button
          key="login"
          variant="default"
          size="sm"
          onClick={() => router.push('/login')}
          className="gap-1"
        >
          <LogIn className="h-3 w-3" />
          {t('login')}
        </Button>
      );
    }

    // 커스텀 액션 버튼
    if (info.actionLabel && info.actionHref) {
      actions.push(
        <Button
          key="custom-action"
          variant="outline"
          size="sm"
          onClick={() => router.push(info.actionHref!)}
          className="gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          {info.actionLabel}
        </Button>
      );
    }

    if (actions.length === 0) return null;

    return <div className="flex flex-wrap gap-2 mt-4">{actions}</div>;
  };

  // 상세 정보 렌더링
  const renderDetails = () => {
    if (!showDetails || !apiError) return null;

    return (
      <Collapsible open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            {isDetailOpen ? (
              <ChevronUp className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            {t('details')}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded-md bg-muted/50 p-3 text-xs font-mono space-y-1">
            <div>
              <span className="text-muted-foreground">{t('codeLabel')} </span>
              <span>{apiError.code}</span>
            </div>
            {apiError.statusCode && (
              <div>
                <span className="text-muted-foreground">{t('httpStatusLabel')} </span>
                <span>{apiError.statusCode}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t('timestampLabel')} </span>
              <span>{formatDate(apiError.timestamp, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            {apiError.details !== undefined && apiError.details !== null && (
              <div className="mt-2">
                <span className="text-muted-foreground">{t('detailLabel')} </span>
                <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                  {typeof apiError.details === 'string'
                    ? apiError.details
                    : JSON.stringify(apiError.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Alert className={`${style.bgClass} ${className}`}>
      <Icon className={`h-4 w-4 ${style.iconClass}`} />
      <AlertTitle className={`flex items-center justify-between ${style.titleClass}`}>
        <span>{displayTitle}</span>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={onDismiss}>
            <X className="h-3 w-3" />
            <span className="sr-only">{t('close')}</span>
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{displayMessage}</p>

        {/* 해결 방법 */}
        {showSolutions && info.solutions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <div className="flex items-center gap-1 text-sm font-medium mb-2">
              <Lightbulb className="h-3 w-3" />
              {t('solutionsTitle')}
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {info.solutions.map((solution, index) => (
                <li key={index}>{solution}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        {renderActions()}

        {/* 상세 정보 */}
        {renderDetails()}
      </AlertDescription>
    </Alert>
  );
}

/**
 * 부분 성공 결과를 표시하는 컴포넌트
 */
interface PartialSuccessAlertProps {
  /** 성공 메시지 */
  successMessage: string;
  /** 실패한 항목 목록 */
  failedItems: Array<{
    type: string;
    error: string;
  }>;
  /** 닫기 콜백 */
  onDismiss?: () => void;
  className?: string;
}

export function PartialSuccessAlert({
  successMessage,
  failedItems,
  onDismiss,
  className = '',
}: PartialSuccessAlertProps) {
  const t = useTranslations('common.errors');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <Alert className={`bg-brand-warning/10 border-brand-warning/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-brand-warning" />
      <AlertTitle className="flex items-center justify-between text-brand-warning">
        <span>{t('partialSaveTitle')}</span>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={onDismiss}>
            <X className="h-3 w-3" />
            <span className="sr-only">{t('close')}</span>
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{successMessage}</p>

        {failedItems.length > 0 && (
          <>
            <p className="text-sm text-brand-warning mt-2">
              {t('partialSaveFailed', { count: failedItems.length })}
            </p>

            <Collapsible open={isDetailOpen} onOpenChange={setIsDetailOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-normal text-brand-warning hover:text-brand-warning/80"
                >
                  {isDetailOpen ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {t('viewFailed')}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {failedItems.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">
                        {t(`historyTypeLabels.${item.type}` as Parameters<typeof t>[0]) ||
                          item.type}
                      </span>
                      : {item.error}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-brand-warning/20">
          <div className="flex items-center gap-1 text-sm font-medium mb-2">
            <Lightbulb className="h-3 w-3" />
            {t('partialSaveNote')}
          </div>
          <p className="text-sm">{t('partialSaveNoteDesc')}</p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * 인라인 에러 메시지 컴포넌트 (폼 필드용)
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <p className={`text-sm text-destructive flex items-center gap-1 mt-1 ${className}`}>
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

export default ErrorAlert;
