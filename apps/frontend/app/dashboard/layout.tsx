import { UserNav } from '@/components/shared/user-nav';
import { MainNav } from '@/components/shared/main-nav';
import { SideNav } from '@/components/shared/side-nav';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

<div className="flex items-center justify-between h-16 px-6 border-b">
  <MainNav />
  <div className="flex items-center gap-4">
    <ThemeToggle />
    <NotificationsDropdown />
    <UserNav />
  </div>
</div>;
