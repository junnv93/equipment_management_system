'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import softwareApi, { SOFTWARE_TYPE_LABELS, type SoftwareType } from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { Monitor, Search, Package, Layers, Code, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  SOFTWARE_HEADER_TOKENS,
  SOFTWARE_STATS_TOKENS,
  SOFTWARE_SUMMARY_TOKENS,
  SOFTWARE_TABLE_TOKENS,
  SOFTWARE_SEARCH_TOKENS,
  SOFTWARE_EMPTY_STATE_TOKENS,
  getStaggerDelay,
} from '@/lib/design-tokens';

const STATS_ICONS = [
  { key: 'equipment' as const, Icon: Monitor },
  { key: 'types' as const, Icon: Package },
  { key: 'updated' as const, Icon: Layers },
];

export default function SoftwareContent() {
  const t = useTranslations('software');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: registryData, isLoading } = useQuery({
    queryKey: queryKeys.software.registry(),
    queryFn: () => softwareApi.getSoftwareRegistry(),
    ...QUERY_CONFIG.LIST,
  });

  const filteredRegistry =
    registryData?.registry.filter(
      (item) =>
        item.softwareName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const H = SOFTWARE_HEADER_TOKENS;
  const S = SOFTWARE_STATS_TOKENS;
  const SM = SOFTWARE_SUMMARY_TOKENS;
  const T = SOFTWARE_TABLE_TOKENS;
  const SR = SOFTWARE_SEARCH_TOKENS;
  const ES = SOFTWARE_EMPTY_STATE_TOKENS;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className={S.grid}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  const statsValues = [
    registryData?.totalEquipments ?? 0,
    registryData?.totalSoftwareTypes ?? 0,
    registryData?.generatedAt ? format(new Date(registryData.generatedAt), 'MM/dd HH:mm') : '-',
  ];

  const statsLabels = [
    'registry.stats.totalEquipments',
    'registry.stats.totalTypes',
    'registry.stats.lastUpdated',
  ] as const;

  const statsDescs = [
    'registry.stats.equipmentsDesc',
    'registry.stats.typesDesc',
    'registry.stats.updatedDesc',
  ] as const;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className={H.container}>
        <div>
          <h1 className={H.title}>{t('registry.title')}</h1>
          <p className={H.subtitle}>{t('registry.subtitle')}</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={S.grid}>
        {STATS_ICONS.map(({ key, Icon }, i) => (
          <div
            key={key}
            className={S.card.base}
            style={{ animationDelay: getStaggerDelay(i, 'card') }}
          >
            <div className="flex items-center gap-3">
              <div className={cn(S.iconContainer, S.iconBg[key])}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <div className={S.label}>{t(statsLabels[i] as Parameters<typeof t>[0])}</div>
                <div className={S.value}>{String(statsValues[i])}</div>
              </div>
            </div>
            <div className={S.desc}>{t(statsDescs[i] as Parameters<typeof t>[0])}</div>
          </div>
        ))}
      </div>

      {/* 소프트웨어별 요약 */}
      {registryData?.summary && registryData.summary.length > 0 && (
        <div className={SM.section}>
          <div className={SM.sectionHeader}>
            <h2 className={SM.sectionTitle}>{t('registry.summary.title')}</h2>
            <span className={SM.sectionDesc}>{t('registry.summary.description')}</span>
          </div>
          <div className={SM.grid}>
            {registryData.summary.map((sw, i) => (
              <div
                key={sw.softwareName}
                className={SM.card.base}
                tabIndex={0}
                role="group"
                aria-label={sw.softwareName}
                style={{ animationDelay: getStaggerDelay(i, 'list') }}
              >
                <div className={SM.cardIcon}>
                  <Code className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div className={SM.cardInfo}>
                  <div className={SM.cardName}>{sw.softwareName}</div>
                  <div className={SM.cardMeta}>
                    <span className={SM.cardCount}>
                      {t('registry.summary.equipmentCount', { count: sw.equipmentCount })}
                    </span>
                    <span className={SM.cardVersion}>
                      {sw.versions.filter((v) => v).join(', ') || t('registry.summary.noVersion')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 + 테이블 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={SM.sectionTitle}>{t('registry.table.title')}</h2>
          <span className={SM.sectionDesc}>
            {t('registry.table.description', { count: filteredRegistry.length })}
          </span>
        </div>

        <div className={SR.container}>
          <div className={SR.inputWrapper}>
            <Search className={SR.inputIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder={t('registry.table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={SR.input}
              aria-label={t('registry.table.searchPlaceholder')}
            />
          </div>
        </div>

        {filteredRegistry.length === 0 ? (
          <div className={ES.container}>
            <Package className={ES.icon} aria-hidden="true" />
            <p className={ES.title}>{t('registry.table.empty')}</p>
          </div>
        ) : (
          <div className={T.wrapper}>
            <table className={T.table}>
              <thead>
                <tr className={T.headerRow}>
                  <th className={T.headerCell}>{t('registry.table.headers.equipmentName')}</th>
                  <th className={T.headerCell}>{t('registry.table.headers.softwareName')}</th>
                  <th className={T.headerCell}>{t('registry.table.headers.version')}</th>
                  <th className={T.headerCell}>{t('registry.table.headers.type')}</th>
                  <th className={T.headerCell}>{t('registry.table.headers.lastUpdated')}</th>
                  <th className={T.headerCell}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistry.map((item) => (
                  <tr key={`${item.equipmentId}:${item.softwareName}`} className={T.bodyRow}>
                    <td className={cn(T.bodyCell, T.equipmentName)}>{item.equipmentName}</td>
                    <td className={cn(T.bodyCell, T.softwareName)}>{item.softwareName || '-'}</td>
                    <td className={T.bodyCell}>
                      <Badge variant="outline" className="font-mono text-xs tabular-nums">
                        {item.softwareVersion || '-'}
                      </Badge>
                    </td>
                    <td className={T.bodyCell}>
                      {item.softwareType
                        ? SOFTWARE_TYPE_LABELS[item.softwareType as SoftwareType]
                        : '-'}
                    </td>
                    <td className={cn(T.bodyCell, T.date)}>
                      {item.lastUpdated ? format(new Date(item.lastUpdated), 'yyyy-MM-dd') : '-'}
                    </td>
                    <td className={T.bodyCell}>
                      <Link
                        href={`/equipment/${item.equipmentId}/software`}
                        className={T.actionBtn}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('registry.table.viewHistory')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
