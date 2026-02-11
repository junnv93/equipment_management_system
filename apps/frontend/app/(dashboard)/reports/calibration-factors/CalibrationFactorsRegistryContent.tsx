'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import calibrationFactorsApi, {
  FACTOR_TYPE_LABELS,
  type CalibrationFactorRegistry,
} from '@/lib/api/calibration-factors-api';
import { format } from 'date-fns';
import { Calculator, ChevronDown, ChevronRight, FileDown, Search, Building2 } from 'lucide-react';
import Link from 'next/link';

interface CalibrationFactorsRegistryContentProps {
  /** 서버에서 가져온 초기 대장 데이터 */
  initialData: CalibrationFactorRegistry | null;
}

/**
 * 보정계수 대장 Client Component
 *
 * Server Component에서 초기 데이터를 받아 React Query로 관리합니다.
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 전체 장비의 현재 적용 중인 보정계수 현황 관리
 * - 보정계수 타입: 안테나이득, 케이블손실, 경로손실, 증폭기이득 등
 * - 승인된 보정계수만 대장에 포함
 */
export default function CalibrationFactorsRegistryContent({
  initialData,
}: CalibrationFactorsRegistryContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());

  // 보정계수 대장 조회 (초기 데이터 활용)
  const { data: registry, isLoading } = useQuery({
    queryKey: ['calibration-factors-registry'],
    queryFn: () => calibrationFactorsApi.getCalibrationFactorRegistry(),
    placeholderData: initialData ?? undefined,
    staleTime: 60 * 1000, // 1분
  });

  const toggleEquipment = (equipmentId: string) => {
    const newExpanded = new Set(expandedEquipment);
    if (newExpanded.has(equipmentId)) {
      newExpanded.delete(equipmentId);
    } else {
      newExpanded.add(equipmentId);
    }
    setExpandedEquipment(newExpanded);
  };

  const expandAll = () => {
    if (registry?.registry) {
      setExpandedEquipment(new Set(registry.registry.map((item) => item.equipmentId)));
    }
  };

  const collapseAll = () => {
    setExpandedEquipment(new Set());
  };

  // 검색 필터링
  const filteredRegistry = registry?.registry?.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.equipmentId.toLowerCase().includes(search) ||
      item.factors.some(
        (f) =>
          f.factorName.toLowerCase().includes(search) ||
          FACTOR_TYPE_LABELS[f.factorType as keyof typeof FACTOR_TYPE_LABELS]
            ?.toLowerCase()
            .includes(search)
      )
    );
  });

  // CSV 내보내기
  const exportToCSV = () => {
    if (!registry?.registry) return;

    const headers = [
      '장비 ID',
      '보정계수 타입',
      '보정계수 이름',
      '값',
      '단위',
      '적용 시작일',
      '만료일',
      '승인일',
    ];

    const rows = registry.registry.flatMap((item) =>
      item.factors.map((factor) => [
        item.equipmentId,
        FACTOR_TYPE_LABELS[factor.factorType as keyof typeof FACTOR_TYPE_LABELS] ||
          factor.factorType,
        factor.factorName,
        factor.factorValue,
        factor.unit,
        factor.effectiveDate,
        factor.expiryDate || '',
        factor.approvedAt ? format(new Date(factor.approvedAt), 'yyyy-MM-dd') : '',
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calibration-factors-registry-${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보정계수 대장</h1>
          <p className="text-muted-foreground">전체 장비의 현재 적용 중인 보정계수 현황</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          CSV 내보내기
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 장비 수</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registry?.totalEquipments || 0}</div>
            <p className="text-xs text-muted-foreground">보정계수가 등록된 장비</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 보정계수</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registry?.totalFactors || 0}</div>
            <p className="text-xs text-muted-foreground">현재 적용 중인 보정계수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">생성일시</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registry?.generatedAt ? format(new Date(registry.generatedAt), 'HH:mm') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {registry?.generatedAt ? format(new Date(registry.generatedAt), 'yyyy-MM-dd') : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 보정계수 대장 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>장비별 보정계수 현황</CardTitle>
              <CardDescription>
                각 장비를 클릭하면 상세 보정계수를 확인할 수 있습니다
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="장비 ID 또는 보정계수 검색..."
                  className="pl-9 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={expandAll}>
                모두 펼치기
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                모두 접기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredRegistry || filteredRegistry.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 보정계수가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRegistry.map((item) => (
                <Collapsible
                  key={item.equipmentId}
                  open={expandedEquipment.has(item.equipmentId)}
                  onOpenChange={() => toggleEquipment(item.equipmentId)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {expandedEquipment.has(item.equipmentId) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div>
                          <Link
                            href={`/equipment/${item.equipmentId}/calibration-factors`}
                            className="font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.equipmentId}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            보정계수 {item.factorCount}개
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.factors.slice(0, 3).map((factor) => (
                          <Badge key={factor.id} variant="outline" className="text-xs">
                            {FACTOR_TYPE_LABELS[
                              factor.factorType as keyof typeof FACTOR_TYPE_LABELS
                            ] || factor.factorType}
                          </Badge>
                        ))}
                        {item.factors.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.factors.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-9 mt-2 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>타입</TableHead>
                            <TableHead>이름</TableHead>
                            <TableHead>값</TableHead>
                            <TableHead>적용 기간</TableHead>
                            <TableHead>승인일</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.factors.map((factor) => (
                            <TableRow key={factor.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {FACTOR_TYPE_LABELS[
                                    factor.factorType as keyof typeof FACTOR_TYPE_LABELS
                                  ] || factor.factorType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{factor.factorName}</TableCell>
                              <TableCell className="font-mono">
                                {factor.factorValue} {factor.unit}
                              </TableCell>
                              <TableCell>
                                {format(new Date(factor.effectiveDate), 'yyyy-MM-dd')}
                                {factor.expiryDate && (
                                  <> ~ {format(new Date(factor.expiryDate), 'yyyy-MM-dd')}</>
                                )}
                              </TableCell>
                              <TableCell>
                                {factor.approvedAt
                                  ? format(new Date(factor.approvedAt), 'yyyy-MM-dd')
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
