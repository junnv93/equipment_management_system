import { UserNav } from '@/components/user-nav';
import { MainNav } from '@/components/main-nav';
import { SideNav } from '@/components/side-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

      <div className="flex items-center justify-between h-16 px-6 border-b">
        <MainNav />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationsDropdown />
          <UserNav />
        </div>
      </div> 