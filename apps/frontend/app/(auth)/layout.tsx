import React from 'react';

export const metadata = {
  title: '로그인 - 장비 관리 시스템',
  description: '장비 관리 시스템 로그인 페이지',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
} 