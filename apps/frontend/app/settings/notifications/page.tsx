"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

// 알림 설정 폼 스키마 정의
const notificationFormSchema = z.object({
  // 기본 알림 설정
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  frequency: z.enum(["immediate", "daily", "weekly"]),
  notificationTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "시간은 HH:MM 형식이어야 합니다 (예: 09:00).",
  }),
  
  // 알림 유형별 설정
  calibrationDueEnabled: z.boolean().default(true),
  calibrationCompletedEnabled: z.boolean().default(true),
  rentalRequestEnabled: z.boolean().default(true),
  rentalApprovedEnabled: z.boolean().default(true),
  rentalRejectedEnabled: z.boolean().default(true),
  returnRequestedEnabled: z.boolean().default(true),
  returnApprovedEnabled: z.boolean().default(true),
  returnRejectedEnabled: z.boolean().default(true),
  checkoutEnabled: z.boolean().default(true),
  maintenanceEnabled: z.boolean().default(true),
  systemNotificationsEnabled: z.boolean().default(true),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

// 기본 폼 값
const defaultValues: Partial<NotificationFormValues> = {
  emailEnabled: true,
  inAppEnabled: true,
  frequency: "immediate",
  notificationTime: "09:00",
  calibrationDueEnabled: true,
  calibrationCompletedEnabled: true,
  rentalRequestEnabled: true,
  rentalApprovedEnabled: true,
  rentalRejectedEnabled: true,
  returnRequestedEnabled: true,
  returnApprovedEnabled: true,
  returnRejectedEnabled: true,
  checkoutEnabled: true,
  maintenanceEnabled: true,
  systemNotificationsEnabled: true,
};

export default function NotificationSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  });

  // 폼 제출 처리
  async function onSubmit(data: NotificationFormValues) {
    setIsSaving(true);
    
    try {
      // 실제 구현에서는 API 호출
      console.log('알림 설정 저장:', data);
      
      // API 호출 성공 시 메시지 표시 (실제 구현 필요)
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 중 오류 발생:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="알림 설정"
        text="알림 수신 방법과 유형을 관리하세요."
      />
      
      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">기본 설정</TabsTrigger>
          <TabsTrigger value="types">알림 유형</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>알림 기본 설정</CardTitle>
                  <CardDescription>
                    알림을 수신하는 방법과 빈도를 설정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-4">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">이메일 알림</p>
                          <p className="text-sm text-muted-foreground">
                            중요한 알림을 이메일로 받습니다.
                          </p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="emailEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-4">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">앱 내 알림</p>
                          <p className="text-sm text-muted-foreground">
                            시스템 내에서 알림을 표시합니다.
                          </p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="inAppEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알림 빈도</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="알림 빈도 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">즉시</SelectItem>
                              <SelectItem value="daily">일간 요약</SelectItem>
                              <SelectItem value="weekly">주간 요약</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            알림을 받는 빈도를 설정합니다.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notificationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>알림 시간</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-5 w-5 text-muted-foreground" />
                              <Input 
                                {...field}
                                type="time"
                                className="w-24"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            일간/주간 요약을 받을 시간을 설정합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="types">
              <Card>
                <CardHeader>
                  <CardTitle>알림 유형 설정</CardTitle>
                  <CardDescription>
                    수신할 알림 유형을 선택하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">장비 관련</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="calibrationDueEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>교정 예정</FormLabel>
                              <FormDescription>
                                장비 교정 일정 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="calibrationCompletedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>교정 완료</FormLabel>
                              <FormDescription>
                                장비 교정 완료 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="maintenanceEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>유지보수</FormLabel>
                              <FormDescription>
                                장비 유지보수 관련 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <h3 className="text-lg font-medium">대여/반출 관련</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rentalRequestEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>대여 요청</FormLabel>
                              <FormDescription>
                                장비 대여 요청 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rentalApprovedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>대여 승인</FormLabel>
                              <FormDescription>
                                장비 대여 승인 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rentalRejectedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>대여 거절</FormLabel>
                              <FormDescription>
                                장비 대여 거절 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="returnRequestedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>반납 요청</FormLabel>
                              <FormDescription>
                                장비 반납 요청 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="returnApprovedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>반납 승인</FormLabel>
                              <FormDescription>
                                장비 반납 승인 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="returnRejectedEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>반납 거절</FormLabel>
                              <FormDescription>
                                장비 반납 거절 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="checkoutEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-x-2">
                            <div>
                              <FormLabel>체크아웃</FormLabel>
                              <FormDescription>
                                장비 체크아웃 관련 알림
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <h3 className="text-lg font-medium">시스템</h3>
                    
                    <FormField
                      control={form.control}
                      name="systemNotificationsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div>
                            <FormLabel>시스템 알림</FormLabel>
                            <FormDescription>
                              시스템 점검 및 중요 공지 알림
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "저장 중..." : "설정 저장"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
} 