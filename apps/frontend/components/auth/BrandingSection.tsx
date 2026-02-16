import { Settings, Calendar, Shield, Wrench } from 'lucide-react';
import {
  AUTH_CONTENT,
  AUTH_BACKGROUND_TOKENS,
  AUTH_LAYOUT_TOKENS,
  getAuthStaggerDelay,
} from '@/lib/design-tokens';

const ICON_MAP = {
  Settings,
  Calendar,
  Shield,
} as const;

interface BrandingSectionProps {
  currentYear: number;
}

/**
 * BrandingSection - Refined Corporate Authority
 *
 * 디자인 컨셉:
 * - 절제된 권위: 과도한 장식 제거, 강한 브랜드 존재감
 * - 글로벌 기업 SaaS 수준: IBM, Siemens, Bosch의 신뢰감
 * - UL Solutions Brand: Midnight Blue 중심의 절제된 컬러 팔레트
 *
 * 성능 최적화:
 * - Server Component: 클라이언트 번들 크기 0 (lucide-react 아이콘도 SSR)
 * - CSS-only animations: JavaScript 불필요
 * - Design Token SSOT: AUTH_CONTENT, AUTH_BACKGROUND_TOKENS, AUTH_LAYOUT_TOKENS
 */
export function BrandingSection({ currentYear }: BrandingSectionProps) {
  return (
    <aside
      className={`relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden ${AUTH_BACKGROUND_TOKENS.gradient}`}
      aria-hidden="true"
    >
      {/* Single Subtle Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          opacity: AUTH_BACKGROUND_TOKENS.grid.opacity,
          backgroundImage: `
            linear-gradient(${AUTH_BACKGROUND_TOKENS.grid.lineColor} 1px, transparent 1px),
            linear-gradient(90deg, ${AUTH_BACKGROUND_TOKENS.grid.lineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${AUTH_BACKGROUND_TOKENS.grid.size}px ${AUTH_BACKGROUND_TOKENS.grid.size}px`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full p-10 lg:p-12">
        {/* Header: Logo & System Name */}
        <div className="space-y-4">
          {/* Logo Area */}
          <div className="flex items-center gap-3 motion-safe:animate-fade-in motion-reduce:animate-none">
            <div
              className={`flex items-center justify-center ${AUTH_LAYOUT_TOKENS.logo.container} ${AUTH_LAYOUT_TOKENS.logo.borderRadius} bg-ul-red shadow-xl`}
            >
              <Wrench className={`${AUTH_LAYOUT_TOKENS.logo.iconSize} text-white`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {AUTH_CONTENT.brand.systemName}
              </h1>
              <p className="text-sm text-white/60 uppercase tracking-wide">
                {AUTH_CONTENT.brand.systemNameEn}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Value Proposition */}
        <div className="flex-1 flex flex-col justify-center py-12 space-y-8">
          {/* Main Headline */}
          <div className="motion-safe:animate-fade-in-up motion-safe:animation-delay-200 motion-reduce:animate-none">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-px bg-ul-info" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              {AUTH_CONTENT.branding.headline}
              <br />
              <span className="text-ul-info">{AUTH_CONTENT.branding.headlineAccent}</span>
              {AUTH_CONTENT.branding.headlineSuffix}
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-md leading-relaxed">
              {AUTH_CONTENT.branding.subtitle}
            </p>
          </div>

          {/* Feature List (Simple) */}
          <div className="space-y-3">
            {AUTH_CONTENT.features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon];
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-4 rounded-xl
                           bg-white/5 border border-white/10
                           motion-safe:animate-fade-in-up motion-reduce:animate-none"
                  style={{ animationDelay: getAuthStaggerDelay(index, 300, 100) }}
                >
                  {/* Icon Container */}
                  <div className="flex-shrink-0">
                    <div
                      className={`${AUTH_LAYOUT_TOKENS.featureIcon.container} flex items-center justify-center rounded-lg bg-ul-info/20`}
                    >
                      <Icon className={`${AUTH_LAYOUT_TOKENS.featureIcon.iconSize} text-ul-info`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: UL Solutions Branding */}
        <div className="space-y-4 motion-safe:animate-fade-in motion-safe:animation-delay-600 motion-reduce:animate-none">
          {/* Decorative Separator */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-ul-info" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Brand Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-ul-red font-bold text-sm">
                {AUTH_CONTENT.brand.companyName}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-white/50 text-xs italic">{AUTH_CONTENT.brand.tagline}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-wide tabular-nums">
              <span>{currentYear}</span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/30 tabular-nums">
            {AUTH_CONTENT.copyright(currentYear)}
          </p>
        </div>
      </div>
    </aside>
  );
}
