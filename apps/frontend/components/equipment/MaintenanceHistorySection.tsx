'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Plus, Trash2, Wrench } from 'lucide-react';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type {
  MaintenanceHistoryItem,
  CreateMaintenanceHistoryInput,
} from '@/lib/api/equipment-api';

const maintenanceHistorySchema = z.object({
  performedAt: z.string().min(1, '수행 일시를 입력하세요'),
  content: z.string().min(1, '주요 내용을 입력하세요'),
});

interface MaintenanceHistorySectionProps {
  equipmentUuid?: string;
  history: MaintenanceHistoryItem[];
  onAdd: (data: CreateMaintenanceHistoryInput) => Promise<void>;
  onDelete: (historyId: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MaintenanceHistorySection({
  equipmentUuid: _equipmentUuid,
  history,
  onAdd,
  onDelete,
  isLoading: _isLoading = false,
  disabled = false,
}: MaintenanceHistorySectionProps) {
  const t = useTranslations('equipment');
  const { fmtDate } = useDateFormatter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof maintenanceHistorySchema>>({
    resolver: zodResolver(maintenanceHistorySchema),
    defaultValues: {
      performedAt: fmtDate(new Date()),
      content: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof maintenanceHistorySchema>) => {
    setIsSubmitting(true);
    try {
      await onAdd({
        performedAt: data.performedAt,
        content: data.content,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: t('formSections.maintenance.addError', { fallback: '정비 이력 추가 실패' }),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    if (confirm(t('formSections.maintenance.deleteConfirm'))) {
      try {
        await onDelete(historyId);
      } catch (error) {
        toast({
          title: t('formSections.maintenance.deleteError', { fallback: '정비 이력 삭제 실패' }),
          description: error instanceof Error ? error.message : String(error),
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-brand-ok" />
            <CardTitle>{t('maintenanceHistoryTab.sectionTitle')}</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-1" />
                {t('maintenanceHistoryTab.addButton')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('maintenanceHistoryTab.dialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('maintenanceHistoryTab.dialog.description')}
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
                    name="performedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenanceHistoryTab.dialog.performedAt')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenanceHistoryTab.dialog.content')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('maintenanceHistoryTab.dialog.contentPlaceholder')}
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
                      {t('maintenanceHistoryTab.dialog.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? t('maintenanceHistoryTab.dialog.saving')
                        : t('maintenanceHistoryTab.dialog.save')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>{t('maintenanceHistoryTab.sectionDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('maintenanceHistoryTab.empty')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('maintenanceHistoryTab.tableHeaders.performedAt')}</TableHead>
                <TableHead>{t('maintenanceHistoryTab.tableHeaders.content')}</TableHead>
                <TableHead>{t('maintenanceHistoryTab.tableHeaders.performedBy')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{fmtDate(item.performedAt)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{item.content}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.performedByName || '-'}
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
