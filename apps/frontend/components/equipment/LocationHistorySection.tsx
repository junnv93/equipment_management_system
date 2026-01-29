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
import { Plus, Trash2, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import type { LocationHistoryItem, CreateLocationHistoryInput } from '@/lib/api/equipment-api';

const locationHistorySchema = z.object({
  changedAt: z.string().min(1, '변동 일시를 입력하세요'),
  newLocation: z.string().min(1, '설치 위치를 입력하세요').max(100),
  notes: z.string().optional(),
});

interface LocationHistorySectionProps {
  equipmentUuid?: string;
  history: LocationHistoryItem[];
  onAdd: (data: CreateLocationHistoryInput) => Promise<void>;
  onDelete: (historyId: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function LocationHistorySection({
  equipmentUuid: _equipmentUuid,
  history,
  onAdd,
  onDelete,
  isLoading: _isLoading = false,
  disabled = false,
}: LocationHistorySectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof locationHistorySchema>>({
    resolver: zodResolver(locationHistorySchema),
    defaultValues: {
      changedAt: dayjs().format('YYYY-MM-DD'),
      newLocation: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof locationHistorySchema>) => {
    setIsSubmitting(true);
    try {
      await onAdd({
        changedAt: data.changedAt,
        newLocation: data.newLocation,
        notes: data.notes || undefined,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to add location history:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    if (confirm('이 위치 변동 이력을 삭제하시겠습니까?')) {
      try {
        await onDelete(historyId);
      } catch (error) {
        console.error('Failed to delete location history:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <CardTitle>위치 변동 이력</CardTitle>
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
                <DialogTitle>위치 변동 이력 추가</DialogTitle>
                <DialogDescription>
                  장비의 위치 변동 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="changedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>변동 일시 *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>설치 위치 *</FormLabel>
                        <FormControl>
                          <Input placeholder="예: RF1 Room" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비고</FormLabel>
                        <FormControl>
                          <Textarea placeholder="변동 사유나 특이사항" {...field} />
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
        <CardDescription>장비 위치 변동 기록입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            위치 변동 이력이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>변동 일시</TableHead>
                <TableHead>설치 위치</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {dayjs(item.changedAt).format('YYYY-MM-DD')}
                  </TableCell>
                  <TableCell>{item.newLocation}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.notes || '-'}
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
