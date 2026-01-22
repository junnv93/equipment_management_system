'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import dayjs from 'dayjs';

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
    bgClass: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-800 dark:text-red-200',
  },
  warning: {
    variant: 'default' as const,
    icon: AlertTriangle,
    bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    titleClass: 'text-yellow-800 dark:text-yellow-200',
  },
  info: {
    variant: 'default' as const,
    icon: Info,
    bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
    iconClass: 'text-blue-600 dark:text-blue-400',
    titleClass: 'text-blue-800 dark:text-blue-200',
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
        <Button
          key="retry"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          다시 시도
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
          로그인
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
            상세 정보
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="rounded-md bg-muted/50 p-3 text-xs font-mono space-y-1">
            <div>
              <span className="text-muted-foreground">코드: </span>
              <span>{apiError.code}</span>
            </div>
            {apiError.statusCode && (
              <div>
                <span className="text-muted-foreground">HTTP 상태: </span>
                <span>{apiError.statusCode}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">시간: </span>
              <span>{dayjs(apiError.timestamp).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            {apiError.details !== undefined && apiError.details !== null && (
              <div className="mt-2">
                <span className="text-muted-foreground">상세: </span>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">닫기</span>
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
              해결 방법
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const typeLabels: Record<string, string> = {
    location: '위치 변동 이력',
    maintenance: '유지보수 내역',
    incident: '손상/수리 내역',
    calibration: '교정 이력',
  };

  return (
    <Alert className={`bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="flex items-center justify-between text-yellow-800 dark:text-yellow-200">
        <span>부분 저장 완료</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">닫기</span>
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{successMessage}</p>

        {failedItems.length > 0 && (
          <>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              다음 항목은 저장에 실패했습니다 ({failedItems.length}건):
            </p>

            <Collapsible open={isDetailOpen} onOpenChange={setIsDetailOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-normal text-yellow-700 hover:text-yellow-900"
                >
                  {isDetailOpen ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  실패 항목 보기
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {failedItems.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">
                        {typeLabels[item.type] || item.type}
                      </span>
                      : {item.error}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-1 text-sm font-medium mb-2">
            <Lightbulb className="h-3 w-3" />
            안내
          </div>
          <p className="text-sm">
            장비 상세 페이지에서 실패한 이력을 다시 추가할 수 있습니다.
          </p>
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
