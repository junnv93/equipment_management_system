'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AUTH_CONTENT,
  AUTH_MOTION_TOKENS,
  MOTION_PRIMITIVES,
  TRANSITION_PRESETS,
  getSemanticStatusClasses,
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
 * LoginForm - Dark Theme Centered Card Design
 *
 * 디자인: 다크 테마 전용 폼 (부모 카드 내부에 렌더링)
 * - 포커스: box-shadow 0 0 0 2px brand-info/50 (글로우, transition 150ms)
 * - 에러: --color-critical 배경 바 + AlertCircle 아이콘
 */
export function LoginForm({
  callbackUrl = '/',
  onSuccess,
  onError,
  disabled = false,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
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

  const onSubmit = (data: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
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
      }
    });
  };

  const inputClasses = (hasError: boolean) =>
    cn(
      'h-12 pl-10 text-sm',
      'bg-brand-bg-base border-brand-border-subtle',
      'text-brand-text-primary placeholder:text-brand-text-muted',
      TRANSITION_PRESETS.instantBorderShadow,
      hasError
        ? 'border-brand-critical focus-visible:border-brand-critical focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_hsl(var(--brand-color-critical)/0.3)]'
        : 'focus-visible:border-brand-info focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_hsl(var(--brand-color-info)/0.5)]'
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        'space-y-5',
        TRANSITION_PRESETS.moderateTransform,
        shakeError && 'animate-shake'
      )}
      aria-label="로그인 폼"
      data-testid="login-form"
      noValidate
    >
      {/* System Error Message — 카드 상단 빨간 알림 바 */}
      {error && (
        <div
          className={cn(
            'flex items-center gap-2.5 p-3 rounded-lg',
            getSemanticStatusClasses('critical'),
            'motion-safe:animate-slide-down motion-reduce:animate-none'
          )}
          role="alert"
          aria-live="polite"
          data-testid="login-error"
        >
          <AlertCircle className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium font-body text-brand-text-secondary">
          이메일 주소
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
            <Mail
              className={cn(
                `w-4.5 h-4.5 ${TRANSITION_PRESETS.instantColor}`,
                errors.email
                  ? 'text-brand-critical'
                  : 'text-brand-text-muted group-focus-within:text-brand-info'
              )}
              aria-hidden="true"
            />
          </div>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            disabled={isPending || disabled || isSuccess}
            placeholder="equipment@ulsolutions.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
            className={inputClasses(!!errors.email)}
          />
        </div>
        {errors.email && (
          <p
            id="email-error"
            className="text-xs text-brand-critical font-medium pl-0.5"
            aria-live="polite"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium font-body text-brand-text-secondary"
        >
          비밀번호
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none z-10">
            <Lock
              className={cn(
                `w-4.5 h-4.5 ${TRANSITION_PRESETS.instantColor}`,
                errors.password
                  ? 'text-brand-critical'
                  : 'text-brand-text-muted group-focus-within:text-brand-info'
              )}
              aria-hidden="true"
            />
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isPending || disabled || isSuccess}
            placeholder="••••••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
            className={cn(inputClasses(!!errors.password), 'tracking-wider')}
          />
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-xs text-brand-critical font-medium pl-0.5"
            aria-live="polite"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Login Button — --color-info 배경 */}
      <div className="pt-1">
        <Button
          type="submit"
          className={cn(
            'w-full h-12 text-base font-semibold',
            'bg-brand-info text-brand-text-inverse hover:bg-brand-info/90',
            'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-info/50',
            TRANSITION_PRESETS.instantBgShadowTransform,
            'hover:scale-[1.01] active:scale-[0.99]',
            isSuccess && 'bg-brand-ok hover:bg-brand-ok/90'
          )}
          disabled={isPending || disabled || isSuccess}
          data-testid="login-button"
        >
          <div className="flex items-center justify-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle2
                  className="h-5 w-5 motion-safe:animate-scale-in motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>{AUTH_CONTENT.button.loginSuccess}</span>
              </>
            ) : isPending ? (
              <>
                <Loader2
                  className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>{AUTH_CONTENT.button.loginLoading}</span>
              </>
            ) : (
              <span>{AUTH_CONTENT.button.login}</span>
            )}
          </div>
        </Button>
      </div>
    </form>
  );
}
