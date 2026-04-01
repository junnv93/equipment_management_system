import { getPageContainerClasses } from '@/lib/design-tokens';
import { CreateTeamPageSkeleton } from './page';

export default function CreateTeamLoading() {
  return (
    <div className={getPageContainerClasses('form')}>
      <CreateTeamPageSkeleton />
    </div>
  );
}
