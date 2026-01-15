"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getProviders } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// 로그인 스키마 정의
const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<any>(null);
  const [hasAzureAD, setHasAzureAD] = useState(false);
  const [enableLocalAuth, setEnableLocalAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 안전한 콜백 URL 처리
  const callbackUrl = searchParams ? searchParams.get("callbackUrl") || "/" : "/";
  const safeCallbackUrl = callbackUrl.startsWith("/") || callbackUrl.startsWith("http://localhost") 
    ? callbackUrl 
    : "/";

  // 사용 가능한 인증 제공자 확인
  useEffect(() => {
    const loadProviders = async () => {
      const res = await getProviders();
      setProviders(res);
      setHasAzureAD(!!res?.azureAd);
      setEnableLocalAuth(!!res?.credentials);
    };
    loadProviders();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // NextAuth signIn 사용 (로컬 로그인)
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (result?.ok) {
        // 로그인 성공 - 리다이렉트
        router.push(safeCallbackUrl);
        router.refresh(); // 세션 새로고침
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다. 나중에 다시 시도해주세요.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAzureLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn('azure-ad', {
        callbackUrl: safeCallbackUrl,
      });
    } catch (err) {
      setError("Azure AD 로그인 중 오류가 발생했습니다.");
      console.error("Azure AD login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* 왼쪽 브랜딩 섹션 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 flex-col justify-between">
        <div className="text-white">
          <h1 className="text-3xl font-bold">장비 관리 시스템</h1>
          <p className="mt-2 text-blue-100">효율적인 장비 관리를 위한 통합 솔루션</p>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">주요 기능</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-white">쉬운 예약</h3>
              <p className="text-sm text-blue-100">몇 번의 클릭으로 장비 예약</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-white">실시간 추적</h3>
              <p className="text-sm text-blue-100">장비 위치 및 상태 실시간 확인</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-white">자동 알림</h3>
              <p className="text-sm text-blue-100">반납 알림 및 교정 일정 관리</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-white">종합 보고서</h3>
              <p className="text-sm text-blue-100">사용 현황 및 분석 리포트</p>
            </div>
          </div>
        </div>
        
        <div className="text-blue-100 text-sm">
          © 2025 장비 관리 시스템. All rights reserved.
        </div>
      </div>
      
      {/* 오른쪽 로그인 폼 */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="text-sm text-muted-foreground">계정 정보를 입력하여 로그인하세요</p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4 mt-4">
              {/* Azure AD 로그인 버튼 (설정된 경우) */}
              {hasAzureAD && (
                <>
                  <Button
                    type="button"
                    onClick={handleAzureLogin}
                    className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white"
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" fill="currentColor">
                      <path d="M0 0h23v23H0z" fill="#f25022"/>
                      <path d="M0 0h11v11H0z" fill="#7fba00"/>
                      <path d="M12 0h11v11H12z" fill="#00a4ef"/>
                      <path d="M0 12h11v11H0z" fill="#ffb900"/>
                    </svg>
                    Microsoft 계정으로 로그인
                  </Button>
                  
                  {enableLocalAuth && (
                    <div className="flex items-center gap-2">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">또는</span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                </>
              )}

              {/* 로컬 로그인 폼 (개발 환경에서만) */}
              {enableLocalAuth && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">이메일</label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      disabled={isLoading}
                      placeholder="admin@example.com"
                      {...register("email")}
                      className={cn(errors.email && "border-red-500")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password" 
                      disabled={isLoading}
                      placeholder="••••••••"
                      {...register("password")}
                      className={cn(errors.password && "border-red-500")}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "로그인 중..." : "이메일로 로그인"}
                  </Button>
                </form>
              )}

              {/* 인증 방법이 없는 경우 */}
              {!hasAzureAD && !enableLocalAuth && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                  인증 설정이 필요합니다. 환경 변수를 확인하세요.
                </div>
              )}
            </div>
          </CardContent>
          
          {enableLocalAuth && (
            <CardFooter className="flex flex-col">
              <div className="text-center text-sm text-muted-foreground mt-2">
                <p className="text-xs">개발 환경 테스트 계정:</p>
                <p className="text-xs">관리자: admin@example.com / admin123</p>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
} 