'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  EquipmentStatusEnum,
  CalibrationMethodEnum,
  SiteEnum,
  type EquipmentStatus,
  type CalibrationMethod,
  type Site,
} from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import dayjs from 'dayjs';

/**
 * 장비 상태값 한글 라벨 매핑
 * API_STANDARDS.md의 표준 상태값을 한글로 변환
 */
const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중',
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  under_maintenance: '유지보수 중',
  non_conforming: '부적합',
  retired: '사용 중지',
};

/**
 * 교정 방법 한글 라벨 매핑
 */
const CALIBRATION_METHOD_LABELS: Record<CalibrationMethod, string> = {
  external_calibration: '외부 교정',
  self_inspection: '자체 점검',
  not_applicable: '비대상',
};

interface EquipmentFormProps {
  initialData?: Partial<CreateEquipmentInput>;
  onSubmit: (
    data: CreateEquipmentInput | UpdateEquipmentInput,
    files?: UploadedFile[]
  ) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function EquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isLoading = false,
}: EquipmentFormProps) {
  // 스키마 선택 (등록/수정)
  const schema = isEdit ? updateEquipmentSchema : createEquipmentSchema;

  // 사용자 정보 가져오기 (사이트 기본값 설정용)
  const { user } = useAuth();
  const userSite = (user as any)?.site as Site | undefined;

  // 폼에서 날짜는 문자열로 처리하고, 제출 시 Date로 변환
  // CreateEquipmentInput과 UpdateEquipmentInput의 모든 필드를 포함하되, 날짜 필드만 문자열로 변경
  type FormValues = {
    name?: string;
    managementNumber?: string;
    assetNumber?: string;
    modelName?: string;
    manufacturer?: string;
    serialNumber?: string;
    location?: string;
    description?: string;
    calibrationCycle?: number;
    lastCalibrationDate?: string; // Date 대신 string
    nextCalibrationDate?: string; // Date 대신 string
    calibrationAgency?: string;
    needsIntermediateCheck?: boolean;
    calibrationMethod?: CalibrationMethod;
    purchaseYear?: number;
    teamId?: number;
    managerId?: string;
    site?: Site;
    supplier?: string;
    contactInfo?: string;
    softwareVersion?: string;
    firmwareVersion?: string;
    manualLocation?: string;
    accessories?: string;
    mainFeatures?: string;
    technicalManager?: string;
    status?: EquipmentStatus;
    // 추가 필수 필드 (프롬프트 3 요구사항)
    equipmentType?: string;
    calibrationResult?: string;
    correctionFactor?: string;
    intermediateCheckSchedule?: string;
    repairHistory?: string;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      managementNumber: initialData?.managementNumber || '',
      assetNumber: initialData?.assetNumber || '',
      modelName: initialData?.modelName || '',
      manufacturer: initialData?.manufacturer || '',
      serialNumber: initialData?.serialNumber || '',
      location: initialData?.location || '',
      description: initialData?.description || '',
      calibrationCycle: initialData?.calibrationCycle,
      lastCalibrationDate: initialData?.lastCalibrationDate
        ? dayjs(initialData.lastCalibrationDate).format('YYYY-MM-DD')
        : '',
      nextCalibrationDate: initialData?.nextCalibrationDate
        ? dayjs(initialData.nextCalibrationDate).format('YYYY-MM-DD')
        : '',
      calibrationAgency: initialData?.calibrationAgency || '',
      needsIntermediateCheck: initialData?.needsIntermediateCheck || false,
      calibrationMethod: initialData?.calibrationMethod,
      purchaseYear: initialData?.purchaseYear,
      teamId: initialData?.teamId,
      managerId: initialData?.managerId || '',
      site: (initialData?.site || userSite) as Site | undefined,
      supplier: initialData?.supplier || '',
      contactInfo: initialData?.contactInfo || '',
      softwareVersion: initialData?.softwareVersion || '',
      firmwareVersion: initialData?.firmwareVersion || '',
      manualLocation: initialData?.manualLocation || '',
      accessories: initialData?.accessories || '',
      mainFeatures: initialData?.mainFeatures || '',
      technicalManager: initialData?.technicalManager || '',
      status: (initialData?.status || 'available') as EquipmentStatus,
      equipmentType: initialData?.equipmentType || '',
      calibrationResult: initialData?.calibrationResult || '',
      correctionFactor: initialData?.correctionFactor || '',
      intermediateCheckSchedule: initialData?.intermediateCheckSchedule
        ? dayjs(initialData.intermediateCheckSchedule).format('YYYY-MM-DD')
        : '',
      repairHistory: initialData?.repairHistory || '',
    },
  });

  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 폼 제출 핸들러
  const handleSubmit = async (data: FormValues) => {
    // 날짜 문자열을 Date 객체로 변환
    // 빈 문자열을 undefined로 변환하여 타입 안전성 보장
    const processedData = {
      name: data.name,
      managementNumber: data.managementNumber,
      assetNumber: data.assetNumber || undefined,
      modelName: data.modelName || undefined,
      manufacturer: data.manufacturer || undefined,
      serialNumber: data.serialNumber || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      calibrationCycle: data.calibrationCycle || undefined,
      lastCalibrationDate: data.lastCalibrationDate
        ? dayjs(data.lastCalibrationDate).toDate()
        : undefined,
      nextCalibrationDate: data.nextCalibrationDate
        ? dayjs(data.nextCalibrationDate).toDate()
        : undefined,
      calibrationAgency: data.calibrationAgency || undefined,
      needsIntermediateCheck: data.needsIntermediateCheck || false,
      calibrationMethod: data.calibrationMethod || undefined,
      purchaseYear: data.purchaseYear || undefined,
      teamId: data.teamId || undefined,
      managerId: data.managerId && data.managerId.trim() ? data.managerId : undefined,
      site: data.site || undefined,
      supplier: data.supplier && data.supplier.trim() ? data.supplier : undefined,
      contactInfo: data.contactInfo && data.contactInfo.trim() ? data.contactInfo : undefined,
      softwareVersion:
        data.softwareVersion && data.softwareVersion.trim() ? data.softwareVersion : undefined,
      firmwareVersion:
        data.firmwareVersion && data.firmwareVersion.trim() ? data.firmwareVersion : undefined,
      manualLocation:
        data.manualLocation && data.manualLocation.trim() ? data.manualLocation : undefined,
      accessories: data.accessories && data.accessories.trim() ? data.accessories : undefined,
      mainFeatures: data.mainFeatures && data.mainFeatures.trim() ? data.mainFeatures : undefined,
      technicalManager:
        data.technicalManager && data.technicalManager.trim() ? data.technicalManager : undefined,
      status: data.status || undefined,
      equipmentType:
        data.equipmentType && data.equipmentType.trim() ? data.equipmentType : undefined,
      calibrationResult:
        data.calibrationResult && data.calibrationResult.trim()
          ? data.calibrationResult
          : undefined,
      correctionFactor:
        data.correctionFactor && data.correctionFactor.trim() ? data.correctionFactor : undefined,
      intermediateCheckSchedule: data.intermediateCheckSchedule
        ? dayjs(data.intermediateCheckSchedule).toDate()
        : undefined,
      repairHistory:
        data.repairHistory && data.repairHistory.trim() ? data.repairHistory : undefined,
    } as CreateEquipmentInput | UpdateEquipmentInput;
    await onSubmit(processedData, uploadedFiles.length > 0 ? uploadedFiles : undefined);
  };

  // 교정 주기 변경 시 다음 교정일 자동 계산
  const calibrationCycle = form.watch('calibrationCycle');
  const lastCalibrationDate = form.watch('lastCalibrationDate');

  useEffect(() => {
    if (calibrationCycle && lastCalibrationDate && typeof lastCalibrationDate === 'string') {
      const nextDate = dayjs(lastCalibrationDate)
        .add(calibrationCycle, 'month')
        .format('YYYY-MM-DD');
      form.setValue('nextCalibrationDate', nextDate);
    }
  }, [calibrationCycle, lastCalibrationDate, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>장비의 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>장비명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: RF 분석기" {...field} />
                    </FormControl>
                    <FormDescription>장비의 이름을 입력하세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managementNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>관리번호 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: EQ-001" {...field} />
                    </FormControl>
                    <FormDescription>고유한 관리번호를 입력하세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>자산번호</FormLabel>
                    <FormControl>
                      <Input placeholder="예: ASSET-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모델명</FormLabel>
                    <FormControl>
                      <Input placeholder="예: MS2720A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제조사</FormLabel>
                    <FormControl>
                      <Input placeholder="예: Anritsu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>일련번호</FormLabel>
                    <FormControl>
                      <Input placeholder="예: SN123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>위치</FormLabel>
                    <FormControl>
                      <Input placeholder="예: RF 시험실" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>구입년도</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 2023"
                        min={1990}
                        max={2100}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사이트 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="사이트를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="suwon">수원</SelectItem>
                        <SelectItem value="uiwang">의왕</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>장비가 위치한 사이트를 선택하세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="장비에 대한 상세 설명을 입력하세요"
                      className="min-h-[100px]"
                      value={typeof field.value === 'string' ? field.value : ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 교정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>교정 정보</CardTitle>
            <CardDescription>장비의 교정 관련 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calibrationCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교정 주기 (개월)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 12"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>교정 주기를 개월 단위로 입력하세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastCalibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마지막 교정일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      교정 주기와 함께 입력하면 다음 교정일이 자동 계산됩니다
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextCalibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>다음 교정 예정일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calibrationAgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교정 기관</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 한국표준과학연구원" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calibrationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교정 방법</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="교정 방법을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CALIBRATION_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="needsIntermediateCheck"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>중간점검 대상</FormLabel>
                    <FormDescription>
                      교정 주기 중간에 점검이 필요한 장비인지 선택하세요
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 추가 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>추가 정보</CardTitle>
            <CardDescription>장비의 추가 정보를 입력하세요 (선택사항)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>공급사</FormLabel>
                    <FormControl>
                      <Input placeholder="예: ABC 공급사" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 02-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="softwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>S/W 버전</FormLabel>
                    <FormControl>
                      <Input placeholder="예: v1.0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firmwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>펌웨어 버전</FormLabel>
                    <FormControl>
                      <Input placeholder="예: v2.1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technicalManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기술책임자</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>관리자 ID</FormLabel>
                    <FormControl>
                      <Input placeholder="예: user-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="manualLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메뉴얼 위치</FormLabel>
                  <FormControl>
                    <Input placeholder="예: /docs/manuals/equipment-001.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>부속품</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="부속품 목록을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mainFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주요 기능</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="장비의 주요 기능을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 추가 필수 필드 (프롬프트 3 요구사항) */}
            <FormField
              control={form.control}
              name="equipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장비 타입</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 분석기, 측정기" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calibrationResult"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교정 결과</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="교정 결과를 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correctionFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>보정계수</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 1.002" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intermediateCheckSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>중간점검일정</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repairHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장비 수리 내역</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="장비 수리 내역을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 파일 첨부 */}
        <Card>
          <CardHeader>
            <CardTitle>파일 첨부</CardTitle>
            <CardDescription>
              {isEdit ? '이력카드' : '검수보고서'}를 첨부하세요 (선택사항)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              files={uploadedFiles}
              onChange={setUploadedFiles}
              attachmentType={isEdit ? 'history_card' : 'inspection_report'}
              label={isEdit ? '이력카드 첨부' : '검수보고서 첨부'}
              description={
                isEdit
                  ? '기존 장비 등록 시 이력카드를 첨부하세요'
                  : '신규 장비 등록 시 검수보고서를 첨부하세요'
              }
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : isEdit ? '수정' : '등록'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
