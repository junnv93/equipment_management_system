import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';

export default function ValidationDetailLoading() {
  return (
    <div className={getPageContainerClasses()}>
      <Skeleton className="h-8 w-48 mb-4" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
