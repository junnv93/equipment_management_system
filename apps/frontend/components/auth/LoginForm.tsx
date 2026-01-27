'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력하세요').email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  callbackUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function LoginForm({
  callbackUrl = '/',
  onSuccess,
  onError,
  disabled = false,
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.';
        setError(errorMessage);
        triggerShake();
        onError?.(errorMessage);
      } else if (result?.ok) {
        setIsSuccess(true);
        onSuccess?.();
        // 세션이 완전히 초기화될 시간을 주고 리다이렉트
        // window.location.href는 새로운 세션 쿠키가 적용되도록 전체 페이지 새로고침
        setTimeout(() => {
          window.location.href = callbackUrl.startsWith('/') ? callbackUrl : '/';
        }, 300);
      }
    } catch (err) {
      const errorMessage = '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      triggerShake();
      onError?.(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-5', shakeError && 'animate-shake')}
      aria-label="로그인 폼"
      data-testid="login-form"
      noValidate
    >
      {/* 이메일 필드 */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground"
        >
          이메일
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Mail className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isLoading || disabled || isSuccess}
            placeholder="admin@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
            className={cn(
              'pl-10 h-12 bg-white dark:bg-card border-border',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              errors.email && 'border-destructive focus:border-destructive focus:ring-destructive/20'
            )}
          />
        </div>
        {errors.email && (
          <p
            id="email-error"
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
          >
            <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* 비밀번호 필드 */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          비밀번호
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isLoading || disabled || isSuccess}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
            className={cn(
              'pl-10 h-12 bg-white dark:bg-card border-border',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200',
              errors.password && 'border-destructive focus:border-destructive focus:ring-destructive/20'
            )}
          />
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
          >
            <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
          aria-live="polite"
          data-testid="login-error"
        >
          <span className="flex-shrink-0 w-1.5 h-1.5 bg-destructive rounded-full" />
          {error}
        </div>
      )}

      {/* 로그인 버튼 - UL Midnight Blue */}
      <Button
        type="submit"
        className={cn(
          'w-full h-12 text-base font-medium',
          'bg-ul-midnight hover:bg-ul-midnight-dark text-white',
          'focus:ring-2 focus:ring-ul-midnight/50 focus:ring-offset-2',
          'transition-all duration-200',
          'hover:scale-[1.01] active:scale-[0.99]',
          isSuccess && 'bg-ul-green hover:bg-ul-green'
        )}
        disabled={isLoading || disabled || isSuccess}
        data-testid="login-button"
      >
        {isSuccess ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5 animate-scale-in" aria-hidden="true" />
            로그인 성공
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            로그인 중...
          </>
        ) : (
          '로그인'
        )}
      </Button>
    </form>
  );
}
