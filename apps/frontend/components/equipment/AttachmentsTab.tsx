'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paperclip } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';

interface AttachmentsTabProps {
  equipment: Equipment;
}

export function AttachmentsTab({ equipment: _equipment }: AttachmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-ul-midnight" />
          첨부파일
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Paperclip className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>첨부파일 기능은 준비 중입니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
