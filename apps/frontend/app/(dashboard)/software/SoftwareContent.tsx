'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import softwareApi, { SOFTWARE_TYPE_LABELS, SoftwareType } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { Monitor, Search, Package, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function SoftwareContent() {
  const [searchTerm, setSearchTerm] = useState('');

  // 소프트웨어 관리대장 조회
  const { data: registryData, isLoading } = useQuery({
    queryKey: queryKeys.software.registry(),
    queryFn: () => softwareApi.getSoftwareRegistry(),
  });

  const filteredRegistry =
    registryData?.registry.filter(
      (item) =>
        item.softwareName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">소프트웨어 통합 관리대장</h1>
        <p className="text-muted-foreground">전체 장비의 소프트웨어 현황을 조회합니다</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">소프트웨어 보유 장비</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registryData?.totalEquipments || 0}</div>
            <p className="text-xs text-muted-foreground">소프트웨어가 등록된 장비</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">소프트웨어 종류</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registryData?.totalSoftwareTypes || 0}</div>
            <p className="text-xs text-muted-foreground">고유 소프트웨어 종류</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">마지막 업데이트</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registryData?.generatedAt
                ? format(new Date(registryData.generatedAt), 'MM/dd HH:mm')
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">관리대장 생성 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 소프트웨어별 요약 */}
      {registryData?.summary && registryData.summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>소프트웨어별 현황</CardTitle>
            <CardDescription>각 소프트웨어를 사용하는 장비 수와 버전 정보</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registryData.summary.map((sw) => (
                <Card key={sw.softwareName} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{sw.softwareName}</span>
                      <Badge variant="secondary">{sw.equipmentCount}대</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      버전: {sw.versions.filter((v) => v).join(', ') || '정보 없음'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>장비별 소프트웨어 상세</CardTitle>
          <CardDescription>
            총 {filteredRegistry.length}개의 소프트웨어가 등록되어 있습니다
          </CardDescription>
          <div className="relative w-full max-w-sm pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-1" />
            <Input
              placeholder="소프트웨어명 또는 장비명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistry.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 소프트웨어가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>장비명</TableHead>
                  <TableHead>소프트웨어명</TableHead>
                  <TableHead>버전</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>마지막 업데이트</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistry.map((item) => (
                  <TableRow key={item.equipmentId}>
                    <TableCell className="font-medium">{item.equipmentName}</TableCell>
                    <TableCell>{item.softwareName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.softwareVersion || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.softwareType
                        ? SOFTWARE_TYPE_LABELS[item.softwareType as SoftwareType]
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.lastUpdated ? format(new Date(item.lastUpdated), 'yyyy-MM-dd') : '-'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/equipment/${item.equipmentId}/software`}
                        className="text-primary hover:underline text-sm"
                      >
                        이력 보기
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
