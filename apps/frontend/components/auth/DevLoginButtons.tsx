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

interface DevLoginButtonsProps {
  callbackUrl?: string;
}

interface TestUser {
  email: string;
  role: string;
  label: string;
  color: string;
}

const TEST_USERS_BY_TEAM = {
  'suwon-fcc-emc-rf': {
    label: '수원 FCC EMC/RF',
    users: [
      {
        email: 'test.engineer@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        email: 'tech.manager@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-green-600 hover:bg-green-700',
      },
      {
        email: 'quality.manager@example.com',
        role: 'quality_manager',
        label: '품질책임자',
        color: 'bg-yellow-600 hover:bg-yellow-700',
      },
      {
        email: 'lab.manager@example.com',
        role: 'lab_manager',
        label: '시험소장',
        color: 'bg-purple-600 hover:bg-purple-700',
      },
      {
        email: 'system.admin@example.com',
        role: 'system_admin',
        label: '시스템 관리자',
        color: 'bg-red-600 hover:bg-red-700',
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
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        email: 'tech.manager.suwon.general.emc@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-green-600 hover:bg-green-700',
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
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        email: 'tech.manager.suwon.sar@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-green-600 hover:bg-green-700',
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
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        email: 'manager2@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-green-600 hover:bg-green-700',
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
        color: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        email: 'tech.manager.pyeongtaek@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        color: 'bg-green-600 hover:bg-green-700',
      },
      {
        email: 'admin2@example.com',
        role: 'lab_manager',
        label: '시험소장',
        color: 'bg-purple-600 hover:bg-purple-700',
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
        <p className="text-xs font-medium text-muted-foreground mb-2">
          🔧 개발자 모드 - 빠른 로그인
        </p>
      </div>

      {/* Team Selector */}
      <div className="space-y-2">
        <Label htmlFor="team-select" className="text-xs text-muted-foreground">
          팀 선택
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
        <Label className="text-xs text-muted-foreground">역할 선택</Label>
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
                  로그인 중...
                </>
              ) : (
                user.label
              )}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-2">
        팀과 역할을 선택하여 즉시 로그인됩니다 (개발 환경 전용)
      </p>
    </div>
  );
}
