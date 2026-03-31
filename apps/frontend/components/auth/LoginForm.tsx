'use client';

import { useState, useMemo, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AUTH_ERROR_CODE } from '@equipment-management/shared-constants';
import { Loader2, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AUTH_MOTION_TOKENS, MOTION_PRIMITIVES, TRANSITION_PRESETS } from '@/lib/design-tokens';

function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}
type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

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
  const t = useTranslations('auth.login');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

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
          const isServerDown = result.code === AUTH_ERROR_CODE.SERVER_UNAVAILABLE;
          const errorMessage = isServerDown ? t('serverUnavailable') : t('authFailed');
          setError(errorMessage);
          triggerShake();
          onError?.(errorMessage);
        } else if (result?.ok) {
          setIsSuccess(true);
          onSuccess?.();
          setTimeout(() => {
            window.location.href = callbackUrl.startsWith('/') ? callbackUrl : '/';
          }, MOTION_PRIMITIVES.duration.moderate);
        }
      } catch (err) {
        setError(t('systemError'));
        triggerShake();
        onError?.(t('systemError'));
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
        'space-y-4',
        TRANSITION_PRESETS.moderateTransform,
        shakeError && 'animate-shake'
      )}
      aria-label={t('formAriaLabel')}
      data-testid="login-form"
      noValidate
    >
      {/* System Error Message — 좌측보더 스타일 (AP-05: badge 외 다른 표현) */}
      {error && (
        <div
          className={cn(
            'flex items-center gap-2.5 py-3 px-4 rounded-lg',
            'bg-brand-critical/[0.06] border-l-[3px] border-brand-critical',
            'motion-safe:animate-slide-down motion-reduce:animate-none'
          )}
          role="alert"
          aria-live="polite"
          data-testid="login-error"
        >
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-brand-critical" aria-hidden="true" />
          <span className="text-sm font-medium text-brand-critical">{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium font-body text-brand-text-secondary">
          {t('emailLabel')}
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
          {t('passwordLabel')}
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

      {/* Login Button — spacious gap from inputs (AP-02 간격 차등) */}
      <div className="pt-2">
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
                <span>{t('submitSuccess')}</span>
              </>
            ) : isPending ? (
              <>
                <Loader2
                  className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>{t('submitting')}</span>
              </>
            ) : (
              <span>{t('submitButton')}</span>
            )}
          </div>
        </Button>
      </div>
    </form>
  );
}
