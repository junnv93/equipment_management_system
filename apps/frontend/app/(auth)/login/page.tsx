"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 로그인 폼 스키마 정의 - 더 엄격한 유효성 검사 적용
const loginSchema = z.object({
  email: z.string().email({
    message: "유효한 이메일 형식이 아닙니다.",
  }),
  password: z.string().min(8, {
    message: "비밀번호는 최소 8자 이상이어야 합니다.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 다크모드 감지 로직 최적화
  useEffect(() => {
    // 초기 상태 설정
    const checkDarkMode = () => {
      if (typeof window === 'undefined') return false;
      
      // 1. HTML 클래스 확인 (가장 우선)
      if (document.documentElement.classList.contains('dark')) {
        return true;
      }
      
      // 2. localStorage 확인
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        return true;
      }
      
      // 3. 시스템 설정 확인 (localStorage에 'theme'이 없을 때만)
      if (storedTheme === null) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      return false;
    };

    // 초기 상태 설정 및 media query 이벤트 리스너 설정
    setIsDarkMode(checkDarkMode());
    
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newDarkModeValue = checkDarkMode();
      if (isDarkMode !== newDarkModeValue) {
        setIsDarkMode(newDarkModeValue);
      }
    };
    
    // 다크모드 변경 감지
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    // DOM 변경 감지 (theme 클래스 추가/제거)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' && 
          mutation.target === document.documentElement
        ) {
          handleChange();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, [isDarkMode]);

  // 로그인 폼 정의
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 폼 제출 처리
  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      // API 요청
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "인증 과정에서 오류가 발생했습니다.");
      }

      // 로그인 성공 처리
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      
      // 오류 메시지 선택
      let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={cn(
      styles.loginContainer, 
      isDarkMode && styles.darkLoginContainer
    )}>
      <div className={styles.gridPattern} />
      <div className={styles.cardWrapper}>
        <Card className={styles.loginCard}>
          <CardHeader className="space-y-1">
            <div className={styles.logoWrapper}>
              <div className={cn(styles.iconAnimate, styles.logo)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
            </div>
            <CardTitle className={cn("text-2xl font-bold text-center", styles.slideUp)}>
              장비 관리 시스템
            </CardTitle>
            <CardDescription className={cn("text-center", styles.slideUp, styles.delay300)}>
              계정 정보를 입력하여 접속하세요
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.fadeIn}>
            {error && (
              <Alert variant="destructive" className="mb-4 animate-in fade-in-50 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@company.com" 
                          {...field} 
                          autoComplete="email"
                          className="bg-background"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="********" 
                          {...field} 
                          autoComplete="current-password"
                          className="bg-background"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading} 
                  aria-label="로그인"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className={cn("text-sm text-center text-muted-foreground", styles.slideUp, styles.delay500)}>
              계정이 없으신가요?{" "}
              <Link 
                href="/register" 
                className="text-primary hover:text-primary/90 underline underline-offset-4"
                tabIndex={isLoading ? -1 : 0}
              >
                회원가입
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
} 