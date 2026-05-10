import { KeyboardShortcutsProvider } from '@/components/checkouts/KeyboardShortcutsProvider';

interface CheckoutsLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutsLayout({ children }: CheckoutsLayoutProps) {
  return <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>;
}
