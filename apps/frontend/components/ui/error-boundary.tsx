'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  /**
   * 에러 발생 시 렌더할 fallback.
   * 함수 형태로 전달하면 reset 콜백을 받아 Error 컴포넌트의 onRetry와 연결 가능.
   */
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  children: ReactNode;
  /** 에러 발생 시 외부에서 추가 처리 (로깅 등) */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 재사용 가능한 React ErrorBoundary.
 * 클래스 컴포넌트 필수 — hooks는 componentDidCatch를 구현할 수 없음.
 *
 * 사용 예:
 * <ErrorBoundary fallback={(err, reset) => <WorkflowTimelineError onRetry={reset} />}>
 *   <WorkflowTimeline ... />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error !== null) {
      const { fallback } = this.props;
      return typeof fallback === 'function' ? fallback(this.state.error, this.reset) : fallback;
    }
    return this.props.children;
  }
}
