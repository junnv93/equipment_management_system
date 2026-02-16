'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getAuthInputClasses,
  getAuthButtonClasses,
  getAuthErrorClasses,
  AUTH_CONTENT,
  AUTH_LAYOUT_TOKENS,
  AUTH_MOTION_TOKENS,
  MOTION_PRIMITIVES,
} from '@/lib/design-tokens';

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

/**
 * LoginForm - Refined Corporate Design
 *
 * 디자인 컨셉: 절제된 기업용 SaaS 수준의 신뢰감
 * - 과도한 장식 제거
 * - 명확한 레이블과 에러 메시지
 * - WCAG AAA 접근성 준수
 *
 * 디자인 토큰: lib/design-tokens/components/auth.ts 사용
 */
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
    setTimeout(() => setShakeError(false), AUTH_MOTION_TOKENS.errorShake.duration);
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
        setError(AUTH_CONTENT.error.authFailed);
        triggerShake();
        onError?.(AUTH_CONTENT.error.authFailed);
      } else if (result?.ok) {
        setIsSuccess(true);
        onSuccess?.();
        setTimeout(() => {
          window.location.href = callbackUrl.startsWith('/') ? callbackUrl : '/';
        }, MOTION_PRIMITIVES.duration.moderate);
      }
    } catch (err) {
      setError(AUTH_CONTENT.error.systemError);
      triggerShake();
      onError?.(AUTH_CONTENT.error.systemError);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(
          'relative',
          AUTH_LAYOUT_TOKENS.card,
          'space-y-6',
          'motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none',
          shakeError && 'animate-shake'
        )}
        aria-label="로그인 폼"
        data-testid="login-form"
        noValidate
      >
        {/* Header: Simple Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {AUTH_CONTENT.login.formHeading}
          </h2>
          <p className="text-sm text-muted-foreground">{AUTH_CONTENT.login.description}</p>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            이메일 주소
          </label>
          <div className="relative group">
            {/* Icon Container */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
              <Mail
                className={cn(
                  'w-5 h-5 motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none',
                  errors.email
                    ? 'text-destructive'
                    : 'text-muted-foreground group-focus-within:text-primary'
                )}
                aria-hidden="true"
              />
            </div>

            {/* Input Field */}
            <Input
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              disabled={isLoading || disabled || isSuccess}
              placeholder="equipment@ulsolutions.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              className={cn(getAuthInputClasses(!!errors.email), 'text-sm')}
            />
          </div>

          {/* Error Message */}
          {errors.email && (
            <div className="flex items-center gap-2 pl-0.5" aria-live="polite">
              <div
                className="w-1 h-1 rounded-full bg-destructive motion-safe:animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
              <p id="email-error" className="text-xs text-destructive font-medium">
                {errors.email.message}
              </p>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            비밀번호
          </label>
          <div className="relative group">
            {/* Icon Container */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
              <Lock
                className={cn(
                  'w-5 h-5 motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none',
                  errors.password
                    ? 'text-destructive'
                    : 'text-muted-foreground group-focus-within:text-primary'
                )}
                aria-hidden="true"
              />
            </div>

            {/* Input Field */}
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading || disabled || isSuccess}
              placeholder="••••••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
              className={cn(getAuthInputClasses(!!errors.password), 'text-sm tracking-wider')}
            />
          </div>

          {/* Error Message */}
          {errors.password && (
            <div className="flex items-center gap-2 pl-0.5" aria-live="polite">
              <div
                className="w-1 h-1 rounded-full bg-destructive motion-safe:animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
              <p id="password-error" className="text-xs text-destructive font-medium">
                {errors.password.message}
              </p>
            </div>
          )}
        </div>

        {/* System Error Message */}
        {error && (
          <div
            className={cn(
              getAuthErrorClasses(),
              'motion-safe:animate-slide-down motion-reduce:animate-none'
            )}
            role="alert"
            aria-live="polite"
            data-testid="login-error"
          >
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-destructive rounded-full motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="flex-1">
              <div className="text-sm font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* Login Button */}
        <div className="pt-2">
          <Button
            type="submit"
            className={cn(
              getAuthButtonClasses(isSuccess ? 'success' : 'primary'),
              'relative overflow-hidden'
            )}
            disabled={isLoading || disabled || isSuccess}
            data-testid="login-button"
          >
            {/* Button Content */}
            <div className="relative flex items-center justify-center gap-2">
              {isSuccess ? (
                <>
                  <CheckCircle2
                    className="h-5 w-5 motion-safe:animate-scale-in motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span className="font-semibold">{AUTH_CONTENT.button.loginSuccess}</span>
                </>
              ) : isLoading ? (
                <>
                  <Loader2
                    className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <span className="font-semibold">{AUTH_CONTENT.button.loginLoading}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{AUTH_CONTENT.button.login}</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
}
