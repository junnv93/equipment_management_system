'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface DevLoginButtonsProps {
  callbackUrl?: string;
}

const TEST_USERS_BY_TEAM = {
  'suwon-fcc-emc-rf': {
    label: '수원 FCC EMC/RF',
    users: [
      {
        email: 'test.engineer@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-brand-info hover:bg-brand-info/90',
      },
      {
        email: 'tech.manager@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-brand-ok hover:bg-brand-ok/90',
      },
      {
        email: 'quality.manager@example.com',
        role: 'quality_manager',
        label: '품질책임자',
        color: 'bg-brand-warning hover:bg-brand-warning/90',
      },
      {
        email: 'lab.manager@example.com',
        role: 'lab_manager',
        label: '시험소장',
        color: 'bg-brand-purple hover:bg-brand-purple/90',
      },
      {
        email: 'system.admin@example.com',
        role: 'system_admin',
        label: '시스템 관리자',
        color: 'bg-brand-critical hover:bg-brand-critical/90',
      },
    ],
  },
  'suwon-general-emc': {
    label: '수원 General EMC',
    users: [
      {
        email: 'test.engineer.suwon.general.emc@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-brand-info hover:bg-brand-info/90',
      },
      {
        email: 'tech.manager.suwon.general.emc@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-brand-ok hover:bg-brand-ok/90',
      },
    ],
  },
  'suwon-sar': {
    label: '수원 SAR',
    users: [
      {
        email: 'test.engineer.suwon.sar@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-brand-info hover:bg-brand-info/90',
      },
      {
        email: 'tech.manager.suwon.sar@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-brand-ok hover:bg-brand-ok/90',
      },
    ],
  },
  'uiwang-general-rf': {
    label: '의왕 General RF',
    users: [
      {
        email: 'user1@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-brand-info hover:bg-brand-info/90',
      },
      {
        email: 'manager2@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-brand-ok hover:bg-brand-ok/90',
      },
    ],
  },
  'pyeongtaek-auto-emc': {
    label: '평택 Automotive EMC',
    users: [
      {
        email: 'test.engineer.pyeongtaek@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-brand-info hover:bg-brand-info/90',
      },
      {
        email: 'tech.manager.pyeongtaek@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-brand-ok hover:bg-brand-ok/90',
      },
      {
        email: 'admin2@example.com',
        role: 'lab_manager',
        label: '시험소장',
        color: 'bg-brand-purple hover:bg-brand-purple/90',
      },
    ],
  },
};

/**
 * 개발 환경 전용 빠른 로그인 버튼
 *
 * test-login provider를 사용하여 팀별/역할별로 즉시 로그인
 */
export function DevLoginButtons({ callbackUrl = '/' }: DevLoginButtonsProps) {
  const t = useTranslations('auth');
  const [selectedTeam, setSelectedTeam] = useState<string>('suwon-fcc-emc-rf');
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
              className={`w-full ${user.color} text-white font-medium`}
              size="sm"
            >
              {loadingEmail === user.email ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
