import { Suspense } from 'react';
import { Loader2, Wrench } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AuthErrorContent } from './AuthErrorContent';

function LoadingFallback() {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-info">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground">장비 관리 시스템</span>
      </div>

      <Card className="border-0 shadow-xl rounded-2xl bg-background">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-8 w-8 text-muted-foreground motion-safe:animate-spin" />
          </div>
          <div className="h-8 w-32 mx-auto bg-muted rounded animate-pulse" />
        </CardHeader>

        <CardContent className="px-8 pb-4">
          <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 mx-auto bg-muted rounded animate-pulse" />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <div className="h-12 w-full bg-muted rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-muted/50 rounded-lg animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}

export default async function AuthErrorPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const errorType = (searchParams?.error as string) || 'Default';

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-muted/50">
      <Suspense fallback={<LoadingFallback />}>
        <AuthErrorContent errorType={errorType} />
      </Suspense>
    </div>
  );
}
