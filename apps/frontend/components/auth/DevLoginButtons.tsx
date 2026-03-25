'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getSemanticSolidBgClasses } from '@/lib/design-tokens';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { TEST_USERS_BY_TEAM, DEFAULT_TEST_TEAM_KEY } from '@equipment-management/shared-constants';

interface DevLoginButtonsProps {
  callbackUrl?: string;
}

/**
 * 개발 환경 전용 빠른 로그인 버튼
 *
 * test-login provider를 사용하여 팀별/역할별로 즉시 로그인
 */
export function DevLoginButtons({ callbackUrl = '/' }: DevLoginButtonsProps) {
  const t = useTranslations('auth');
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEST_TEAM_KEY);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const handleLogin = async (email: string, role: string) => {
    setLoadingEmail(email);
    try {
      // Use email-based login for more precise user selection
      await signIn('test-login', {
        email,
        role, // fallback for backward compatibility
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setLoadingEmail(null);
    }
  };

  const currentTeam = TEST_USERS_BY_TEAM[selectedTeam as keyof typeof TEST_USERS_BY_TEAM];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-2">🔧 {t('devLogin.heading')}</p>
      </div>

      {/* Team Selector */}
      <div className="space-y-2">
        <Label htmlFor="team-select" className="text-xs text-muted-foreground">
          {t('devLogin.teamSelect')}
        </Label>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger id="team-select" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEST_USERS_BY_TEAM).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Buttons for Selected Team */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('devLogin.roleSelect')}</Label>
        <div className="grid grid-cols-1 gap-2">
          {currentTeam.users.map((user) => (
            <Button
              key={user.email}
              type="button"
              onClick={() => handleLogin(user.email, user.role)}
              disabled={loadingEmail !== null}
              className={`w-full ${getSemanticSolidBgClasses(user.semanticColor)} hover:opacity-90 font-medium`}
              size="sm"
            >
              {loadingEmail === user.email ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                  {t('devLogin.loggingIn')}
                </>
              ) : (
                user.label
              )}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-2">{t('devLogin.hint')}</p>
    </div>
  );
}
