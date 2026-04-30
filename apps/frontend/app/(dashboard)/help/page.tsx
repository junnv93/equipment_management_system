/**
 * Help Page (Sprint 4.5 S6) — In-app FAQ 라우트
 *
 * EmptyState/error fallback 등에서 mailto 외 대체 진입점으로 사용.
 * Next.js 16 sync Server Component (params 없는 정적 라우트). PageProps 타입 미사용.
 *
 * 콘텐츠 정책: 본 페이지는 placeholder 섹션만 게시 — 실제 FAQ 카피는 운영팀과
 * 협의 후 별도 작업. `feedback_no_fabricate_domain_data` 정책 준수.
 *
 * Anchor deep link: `/help#<topicKey>` 형식 (FRONTEND_ROUTES.HELP.TOPIC 빌더).
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const HELP_SECTION_KEYS = ['checkout', 'calibration', 'nonConformance', 'permissions'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('help');
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function HelpPage() {
  const t = await getTranslations('help');

  return (
    <main
      aria-label={t('ariaLandmark')}
      className="mx-auto max-w-3xl p-6 md:p-8 flex flex-col gap-6"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section
        aria-labelledby="help-placeholder-heading"
        className="rounded-md border border-dashed border-border bg-muted/40 p-4"
      >
        <h2 id="help-placeholder-heading" className="text-sm font-semibold">
          {t('placeholder.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t('placeholder.description')}
        </p>
      </section>

      <ul className="flex flex-col gap-4">
        {HELP_SECTION_KEYS.map((key) => (
          <li key={key} id={key} className="rounded-md border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">{t(`sections.${key}.title`)}</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t(`sections.${key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
