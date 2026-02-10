'use client';

import { useState } from 'react';
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
import { formatDate } from '@/lib/utils/date';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof maintenanceHistorySchema>>({
    resolver: zodResolver(maintenanceHistorySchema),
    defaultValues: {
      performedAt: formatDate(new Date(), 'yyyy-MM-dd'),
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
      console.error('Failed to add maintenance history:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    if (confirm('이 유지보수 내역을 삭제하시겠습니까?')) {
      try {
        await onDelete(historyId);
      } catch (error) {
        console.error('Failed to delete maintenance history:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-green-500" />
            <CardTitle>유지보수 내역</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>유지보수 내역 추가</DialogTitle>
                <DialogDescription>유지보수 수행 정보를 입력하세요.</DialogDescription>
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
                        <FormLabel>수행 일시 *</FormLabel>
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
                        <FormLabel>주요 내용 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="예: 분기별 정기 점검 - 정상 동작 확인"
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
                      취소
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '저장 중...' : '저장'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>장비 유지보수 수행 기록입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">유지보수 내역이 없습니다.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수행 일시</TableHead>
                <TableHead>주요 내용</TableHead>
                <TableHead>수행자</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.performedAt, 'yyyy-MM-dd')}</TableCell>
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
