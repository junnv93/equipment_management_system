// UI 컴포넌트 관련 타입 정의
export interface ThemeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
} 