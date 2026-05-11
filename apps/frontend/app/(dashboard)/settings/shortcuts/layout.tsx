import { KeyboardShortcutsProvider } from '@/components/checkouts/KeyboardShortcutsProvider';

interface SettingsShortcutsLayoutProps {
  children: React.ReactNode;
}

/**
 * Settings shortcuts 라우트 전용 레이아웃 — KeyboardShortcutsProvider mount.
 *
 * 본 sprint 라운드 #2 자기검토 갭 #1 closure: 기존 Provider 는 `/checkouts` 전용
 * (apps/frontend/app/(dashboard)/checkouts/layout.tsx) → `/settings/shortcuts`
 * 페이지에서 Context 사용 불가했음. 본 layout 으로 settings 페이지에서도 동일 Context API
 * 적용 → ShortcutsSettingsContent 가 setOverride/clearOverride/resetAllOverrides 사용 가능
 * + 같은 탭 cheatsheet 동기화 보장.
 *
 * 향후 dashboard 전역 layout 승격 시 본 layout 제거 가능 (별도 sprint).
 */
export default function SettingsShortcutsLayout({ children }: SettingsShortcutsLayoutProps) {
  return <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>;
}
