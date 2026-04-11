'use client';

import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { INSPECTION_TABLE, INSPECTION_SPACING } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import DocumentImage from '@/components/shared/DocumentImage';
import type { ResultSection } from '@/lib/api/calibration-api';

interface ResultSectionPreviewProps {
  section: ResultSection;
}

export default function ResultSectionPreview({ section }: ResultSectionPreviewProps) {
  const t = useTranslations('calibration.resultSections');

  switch (section.sectionType) {
    case 'title':
      return <h3 className="text-lg font-bold">{section.title}</h3>;

    case 'text':
      return (
        <div className={INSPECTION_SPACING.tight}>
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{section.content}</p>
        </div>
      );

    case 'data_table': {
      const td = section.tableData;
      if (!td) return null;
      return (
        <div className={INSPECTION_SPACING.field}>
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <div className={INSPECTION_TABLE.wrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  {td.headers.map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {td.rows.map((row, ri) => (
                  <TableRow
                    key={ri}
                    className={cn(INSPECTION_TABLE.stripe, INSPECTION_TABLE.rowHover)}
                  >
                    {row.map((cell, ci) => (
                      <TableCell key={ci} className={INSPECTION_TABLE.numericCell}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    case 'photo':
      return (
        <div className={INSPECTION_SPACING.field}>
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          {section.documentId ? (
            <DocumentImage
              documentId={section.documentId}
              alt={section.title ?? t('types.photo')}
              className="max-h-64 rounded-md border border-border/60 object-contain"
              fallbackClassName="h-32"
            />
          ) : (
            <p className="text-sm text-muted-foreground">({t('types.photo')})</p>
          )}
        </div>
      );

    case 'rich_table': {
      const rd = section.richTableData;
      if (!rd) return null;
      return (
        <div className={INSPECTION_SPACING.field}>
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <div className={INSPECTION_TABLE.wrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  {rd.headers.map((h, i) => (
                    <TableHead key={i}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rd.rows.map((row, ri) => (
                  <TableRow
                    key={ri}
                    className={cn(INSPECTION_TABLE.stripe, INSPECTION_TABLE.rowHover)}
                  >
                    {row.map((cell, ci) => (
                      <TableCell key={ci}>
                        {cell.type === 'text' ? (
                          <span className={INSPECTION_TABLE.numericCell}>{cell.value}</span>
                        ) : cell.documentId ? (
                          <DocumentImage
                            documentId={cell.documentId}
                            alt={t('types.photo')}
                            className="h-12 w-12 rounded object-cover border border-border/60"
                            fallbackClassName="h-12 w-12"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
