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
        <div className="space-y-1">
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{section.content}</p>
        </div>
      );

    case 'data_table': {
      const td = section.tableData;
      if (!td) return null;
      return (
        <div className="space-y-2">
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <div className="overflow-x-auto rounded border">
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
                  <TableRow key={ri}>
                    {row.map((cell, ci) => (
                      <TableCell key={ci}>{cell}</TableCell>
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
        <div className="space-y-2">
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          {section.documentId ? (
            <p className="text-sm text-muted-foreground">
              [{t('types.photo')}] ID: {section.documentId}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">({t('types.photo')})</p>
          )}
        </div>
      );

    case 'rich_table': {
      const rd = section.richTableData;
      if (!rd) return null;
      return (
        <div className="space-y-2">
          {section.title && <h4 className="font-semibold">{section.title}</h4>}
          <div className="overflow-x-auto rounded border">
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
                  <TableRow key={ri}>
                    {row.map((cell, ci) => (
                      <TableCell key={ci}>
                        {cell.type === 'text' ? (
                          cell.value
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            [{t('types.photo')}: {cell.documentId?.slice(0, 8)}...]
                          </span>
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
