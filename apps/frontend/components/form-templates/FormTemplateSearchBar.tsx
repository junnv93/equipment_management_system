'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, ArrowRight, Download, Lock } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  searchFormTemplateByNumber,
  downloadFormTemplateById,
  type FormTemplateSearchResult,
} from '@/lib/api/form-templates-api';
import { getErrorMessage } from '@/lib/api/error';
import { FORM_TEMPLATES_SEARCH_BAR_TOKENS } from '@/lib/design-tokens';
import { toast } from 'sonner';

/**
 * 과거 formNumber 검색 바.
 * - 현행 번호 검색: "현재 유효한 양식입니다" + 다운로드 버튼
 * - 과거 번호 검색: "이 양식은 현재 X로 개정되었습니다" + 현행 다운로드 버튼
 * - 과거 row 다운로드 자체는 DOWNLOAD_FORM_TEMPLATE_HISTORY 권한 필요
 */
export default function FormTemplateSearchBar() {
  const t = useTranslations('form-templates');
  const { can } = useAuth();
  const canDownloadHistory = can(Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FormTemplateSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchFormTemplateByNumber(trimmed);
      setResult(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderDownloadButton = (id: string, label: string, historic: boolean) => {
    const canDownload = !historic || canDownloadHistory;
    const btn = (
      <Button
        variant="outline"
        size="sm"
        disabled={!canDownload || loading}
        onClick={() => canDownload && downloadFormTemplateById(id)}
      >
        {canDownload ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        {label}
      </Button>
    );
    if (canDownload) return btn;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>{btn}</span>
        </TooltipTrigger>
        <TooltipContent>{t('historyDialog.downloadHistoryDenied')}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.container}>
      <div className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.inputRow}>
        <Search className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.leadingIcon} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder={t('search.placeholder')}
          className="flex-1"
        />
        <Button variant="default" size="sm" onClick={handleSearch} disabled={loading}>
          {t('search.button')}
        </Button>
      </div>

      {searched && !loading && result && !result.match && (
        <p className={`mt-3 ${FORM_TEMPLATES_SEARCH_BAR_TOKENS.secondaryText}`}>
          {t('search.noResult')}
        </p>
      )}

      {searched && !loading && result?.match && (
        <div className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.resultBlock}>
          {result.match.isCurrent ? (
            <div className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.relationRow}>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{result.match.formNumber}</Badge>
                <span className="text-muted-foreground">{t('search.foundCurrent')}</span>
              </div>
              {renderDownloadButton(result.match.id, t('download'), false)}
            </div>
          ) : (
            <>
              <div className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.relationRow}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.supersededBadge}
                  >
                    {result.match.formNumber}
                  </Badge>
                  <ArrowRight className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.leadingIcon} />
                  {result.currentForSameForm && (
                    <Badge variant="outline">{result.currentForSameForm.formNumber}</Badge>
                  )}
                </div>
                {result.currentForSameForm &&
                  renderDownloadButton(
                    result.currentForSameForm.id,
                    t('search.viewCurrent'),
                    false
                  )}
              </div>
              <p className={FORM_TEMPLATES_SEARCH_BAR_TOKENS.secondaryText}>
                {t('search.foundHistoric', {
                  currentFormNumber: result.currentForSameForm?.formNumber ?? '-',
                })}
              </p>
              {/* 과거 버전 자체 다운로드 (권한 있을 때만 활성) */}
              <div className="flex justify-end">
                {renderDownloadButton(result.match.id, t('download'), true)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
