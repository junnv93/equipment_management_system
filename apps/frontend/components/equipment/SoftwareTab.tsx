'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';

interface SoftwareTabProps {
  equipment: Equipment;
}

export function SoftwareTab({ equipment }: SoftwareTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-ul-midnight" />
          소프트웨어
        </CardTitle>
      </CardHeader>
      <CardContent>
        {equipment.softwareVersion || equipment.firmwareVersion ? (
          <div className="space-y-4">
            {equipment.softwareVersion && (
              <div>
                <p className="text-sm text-muted-foreground">소프트웨어 버전</p>
                <p className="font-medium">{equipment.softwareVersion}</p>
              </div>
            )}
            {equipment.firmwareVersion && (
              <div>
                <p className="text-sm text-muted-foreground">펌웨어 버전</p>
                <p className="font-medium">{equipment.firmwareVersion}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 소프트웨어 정보가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
