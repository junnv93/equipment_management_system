/**
 * Help Page (Sprint 4.5 S6) — In-app FAQ 라우트
 *
 * EmptyState/error fallback 등에서 mailto 외 대체 진입점으로 사용.
 * Next.js 16 sync Server Component (params 없는 정적 라우트). PageProps 타입 미사용.
 *
 * 콘텐츠 정책: `faqs` 배열이 빈 상태에서는 description placeholder만 렌더링.
 * 실제 FAQ 카피는 운영팀과 협의 후 별도 작업. `feedback_no_fabricate_domain_data` 정책 준수.
 *
 * Anchor deep link: `/help#<topicKey>` 형식 (FRONTEND_ROUTES.HELP.TOPIC 빌더).
 * 토픽 키 SSOT: `HELP_TOPIC_KEYS` (@equipment-management/shared-constants).
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HELP_TOPIC_KEYS, type HelpTopicKey } from '@equipment-management/shared-constants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('help');
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

interface HelpFaqItem {
  q: string;
  a: string;
}

function HelpSection({
  topicKey,
  title,
  description,
  faqs,
}: {
  topicKey: HelpTopicKey;
  title: string;
  description: string;
  faqs: HelpFaqItem[];
}) {
  return (
    <li id={topicKey} className="rounded-md border border-border bg-card p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>

      {faqs.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {faqs.map((faq, idx) => (
            <li key={idx} className="rounded border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-sm font-medium">{faq.q}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
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
        {HELP_TOPIC_KEYS.map((key) => {
          const rawFaqs = t.raw(`sections.${key}.faqs`) as unknown;
          const faqs: HelpFaqItem[] = Array.isArray(rawFaqs) ? (rawFaqs as HelpFaqItem[]) : [];

          return (
            <HelpSection
              key={key}
              topicKey={key}
              title={t(`sections.${key}.title`)}
              description={t(`sections.${key}.description`)}
              faqs={faqs}
            />
          );
        })}
      </ul>
    </main>
  );
}
