'use client';

import { Settings, Calendar, Shield, Wrench } from 'lucide-react';

const features = [
  {
    icon: Settings,
    title: '체계적인 장비 관리',
    description: '장비 등록부터 폐기까지 전 생애주기 관리',
  },
  {
    icon: Calendar,
    title: '실시간 교정 추적',
    description: '교정 일정 알림 및 이력 관리',
  },
  {
    icon: Shield,
    title: '역할 기반 승인',
    description: '안전한 다단계 승인 워크플로우',
  },
];

export function BrandingSection() {
  return (
    <div
      className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-ul-midnight"
      aria-hidden="true"
    >
      {/* 미세한 그리드 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 미세한 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-ul-midnight-dark/30 to-ul-midnight-dark/50" />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col h-full p-10 lg:p-12">
        {/* 로고 영역 - UL Solutions 스타일 */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-ul-red shadow-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              장비 관리 시스템
            </h1>
            <p className="text-sm text-white/60">
              Equipment Management System
            </p>
          </div>
        </div>

        {/* 중앙 영역 */}
        <div className="flex-1 flex flex-col justify-center py-12">
          <div className="animate-fade-in-up animation-delay-200">
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              효율적인 장비 관리를
              <br />
              <span className="text-ul-info">
                통합 솔루션
              </span>
              으로
            </h2>
            <p className="text-lg text-white/70 max-w-md">
              시험소 장비의 등록, 교정, 대여, 반출을 한 곳에서 관리하세요.
            </p>
          </div>

          {/* 기능 하이라이트 */}
          <div className="mt-12 space-y-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-all duration-300
                         animate-fade-in-up"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-ul-info/20">
                  <feature.icon className="w-5 h-5 text-ul-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 - UL Solutions 브랜드 */}
        <div className="animate-fade-in animation-delay-600">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-ul-red font-bold text-sm">UL Solutions</span>
            <span className="text-white/30">|</span>
            <span className="text-white/50 text-sm">Quality & Safety</span>
          </div>
          <p className="text-sm text-white/30">
            © 2025 Equipment Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
