'use client';

import { useState } from 'react';
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
import dayjs from 'dayjs';
import type { IncidentHistoryItem, CreateIncidentHistoryInput, IncidentType } from '@/lib/api/equipment-api';

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  damage: '손상',
  malfunction: '오작동',
  change: '변경',
  repair: '수리',
};

const INCIDENT_TYPE_COLORS: Record<IncidentType, string> = {
  damage: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  malfunction: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  change: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  repair: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof incidentHistorySchema>>({
    resolver: zodResolver(incidentHistorySchema),
    defaultValues: {
      occurredAt: dayjs().format('YYYY-MM-DD'),
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
    if (confirm('이 손상/수리 내역을 삭제하시겠습니까?')) {
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
            <CardTitle>손상/오작동/변경/수리 내역</CardTitle>
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
                <DialogTitle>손상/수리 내역 추가</DialogTitle>
                <DialogDescription>
                  손상, 오작동, 변경, 수리 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="occurredAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>발생 일시 *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>유형 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="유형을 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <Badge
                                  variant="outline"
                                  className={INCIDENT_TYPE_COLORS[value as IncidentType]}
                                >
                                  {label}
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
                        <FormLabel>주요 내용 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="예: 전원부 손상으로 인한 전원 보드 교체 필요"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
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
        <CardDescription>장비 손상, 오작동, 변경, 수리 기록입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            손상/수리 내역이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>발생 일시</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>주요 내용</TableHead>
                <TableHead>보고자</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {dayjs(item.occurredAt).format('YYYY-MM-DD')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={INCIDENT_TYPE_COLORS[item.incidentType]}
                    >
                      {INCIDENT_TYPE_LABELS[item.incidentType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {item.content}
                  </TableCell>
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
