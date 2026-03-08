'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { getIncidentTypeBadgeClasses } from '@/lib/design-tokens';
import type {
  IncidentHistoryItem,
  CreateIncidentHistoryInput,
  IncidentType,
} from '@/lib/api/equipment-api';

const INCIDENT_TYPES: IncidentType[] = ['damage', 'malfunction', 'change', 'repair'];

const incidentHistorySchema = z.object({
  occurredAt: z.string().min(1, '발생 일시를 입력하세요'),
  incidentType: z.enum(['damage', 'malfunction', 'change', 'repair']),
  content: z.string().min(1, '주요 내용을 입력하세요'),
});

interface IncidentHistorySectionProps {
  equipmentUuid?: string;
  history: IncidentHistoryItem[];
  onAdd: (data: CreateIncidentHistoryInput) => Promise<void>;
  onDelete: (historyId: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function IncidentHistorySection({
  equipmentUuid: _equipmentUuid,
  history,
  onAdd,
  onDelete,
  isLoading: _isLoading = false,
  disabled = false,
}: IncidentHistorySectionProps) {
  const t = useTranslations('equipment');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof incidentHistorySchema>>({
    resolver: zodResolver(incidentHistorySchema),
    defaultValues: {
      occurredAt: formatDate(new Date(), 'yyyy-MM-dd'),
      incidentType: undefined,
      content: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof incidentHistorySchema>) => {
    setIsSubmitting(true);
    try {
      await onAdd({
        occurredAt: data.occurredAt,
        incidentType: data.incidentType as IncidentType,
        content: data.content,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to add incident history:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    if (confirm(t('formSections.incident.deleteConfirm'))) {
      try {
        await onDelete(historyId);
      } catch (error) {
        console.error('Failed to delete incident history:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>{t('incidentHistoryTab.sectionTitle')}</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-1" />
                {t('incidentHistoryTab.addButton')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('incidentHistoryTab.dialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('incidentHistoryTab.dialog.descriptionDefault')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.stopPropagation(); // 부모 폼으로 이벤트 버블링 방지
                    form.handleSubmit(handleSubmit)(e);
                  }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="occurredAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('incidentHistoryTab.dialog.occurredAt')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('incidentHistoryTab.dialog.typeLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t('incidentHistoryTab.dialog.typePlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INCIDENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                <Badge
                                  variant="outline"
                                  className={getIncidentTypeBadgeClasses(type)}
                                >
                                  {t(`incidentHistoryTab.types.${type}` as Parameters<typeof t>[0])}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('incidentHistoryTab.dialog.content')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('incidentHistoryTab.dialog.contentPlaceholder')}
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('incidentHistoryTab.dialog.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? t('incidentHistoryTab.dialog.saving')
                        : t('incidentHistoryTab.dialog.save')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>{t('incidentHistoryTab.sectionDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('incidentHistoryTab.empty')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('incidentHistoryTab.tableHeaders.occurredAt')}</TableHead>
                <TableHead>{t('incidentHistoryTab.tableHeaders.type')}</TableHead>
                <TableHead>{t('incidentHistoryTab.tableHeaders.content')}</TableHead>
                <TableHead>{t('incidentHistoryTab.tableHeaders.reporter')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.occurredAt, 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getIncidentTypeBadgeClasses(item.incidentType)}
                    >
                      {t(
                        `incidentHistoryTab.types.${item.incidentType}` as Parameters<typeof t>[0]
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">{item.content}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.reportedByName || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
