/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  safelist: [
    // 로그인 페이지 브랜딩 섹션 (UL Solutions)
    'bg-ul-midnight',
    'bg-ul-midnight-dark',
    'text-white',
    // 반응형 클래스
    'hidden',
    'md:flex',
    'md:w-1/2',
    'lg:w-1/2',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // UL Solutions Brand Colors
        'ul-midnight': {
          DEFAULT: '#122C49',
          dark: '#0a1c30',
          light: '#1e3a5f',
        },
        'ul-fog': '#577E9E',
        'ul-red': {
          DEFAULT: '#CA0123',
          dark: '#5B0428',
          hover: '#A8011D',
        },
        'ul-green': {
          DEFAULT: '#00A451',
          hover: '#008940',
        },
        'ul-blue': {
          DEFAULT: '#0067B1',
          light: '#BCE4F7',
        },
        'ul-orange': '#FF9D55',
        'ul-info': '#BCE4F7',
        'ul-gray': {
          bg: '#EBEBEB',
          1: '#D8D9DA',
          2: '#B5B7B9',
          3: '#939698',
        },
        // Brand Design Tokens
        brand: {
          bg: {
            base: 'hsl(var(--brand-bg-base) / <alpha-value>)',
            surface: 'hsl(var(--brand-bg-surface) / <alpha-value>)',
            elevated: 'hsl(var(--brand-bg-elevated) / <alpha-value>)',
            overlay: 'hsl(var(--brand-bg-overlay) / <alpha-value>)',
          },
          border: {
            subtle: 'hsl(var(--brand-border-subtle) / <alpha-value>)',
            DEFAULT: 'hsl(var(--brand-border-default) / <alpha-value>)',
            strong: 'hsl(var(--brand-border-strong) / <alpha-value>)',
          },
          text: {
            primary: 'hsl(var(--brand-text-primary) / <alpha-value>)',
            secondary: 'hsl(var(--brand-text-secondary) / <alpha-value>)',
            muted: 'hsl(var(--brand-text-muted) / <alpha-value>)',
            inverse: 'hsl(var(--brand-text-inverse) / <alpha-value>)',
          },
          ok: 'hsl(var(--brand-color-ok) / <alpha-value>)',
          warning: 'hsl(var(--brand-color-warning) / <alpha-value>)',
          critical: 'hsl(var(--brand-color-critical) / <alpha-value>)',
          info: 'hsl(var(--brand-color-info) / <alpha-value>)',
          neutral: 'hsl(var(--brand-color-neutral) / <alpha-value>)',
          purple: 'hsl(var(--brand-color-purple) / <alpha-value>)',
          repair: 'hsl(var(--brand-color-repair) / <alpha-value>)',
          temporary: 'hsl(var(--brand-color-temporary) / <alpha-value>)',
          site: {
            suw: 'hsl(var(--brand-color-site-suw) / <alpha-value>)',
            uiw: 'hsl(var(--brand-color-site-uiw) / <alpha-value>)',
            pyt: 'hsl(var(--brand-color-site-pyt) / <alpha-value>)',
          },
        },
        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: 0,
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: 0,
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        // Notification-specific animations
        'badge-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        'checkmark-pop': {
          '0%': { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // Notification list page animations
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 6px hsl(var(--primary) / 0)' },
        },
        staggerFadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Auth-specific animations
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        // Approval page animations
        'approval-exit-success': {
          '0%': {
            backgroundColor: 'hsl(var(--brand-color-ok) / 0.15)',
            opacity: '1',
            transform: 'translateX(0)',
          },
          '40%': {
            backgroundColor: 'hsl(var(--brand-color-ok) / 0.15)',
            opacity: '1',
            transform: 'translateX(0)',
          },
          '100%': {
            backgroundColor: 'hsl(var(--brand-color-ok) / 0.15)',
            opacity: '0',
            transform: 'translateX(24px)',
          },
        },
        'approval-exit-reject': {
          '0%': { backgroundColor: 'hsl(var(--brand-color-critical) / 0.08)', opacity: '1' },
          '100%': { opacity: '0', transform: 'translateX(-16px)' },
        },
        'approval-pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'approval-ring-pop': {
          from: { transform: 'scale(0.6)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'approval-ring-expand': {
          from: { transform: 'scale(0.8)', opacity: '0.4' },
          to: { transform: 'scale(1.3)', opacity: '0' },
        },
        'approval-check-draw': {
          from: { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
          to: { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        'approval-text-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-right': 'slide-right 0.4s ease-out forwards',
        'slide-left': 'slide-left 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        // Notification animations
        'badge-pulse': 'badge-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkmark-pop': 'checkmark-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
        // Auth animations
        shake: 'shake 0.5s ease-in-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
        // Approval page animations
        'approval-exit-success': 'approval-exit-success 0.6s ease-out forwards',
        'approval-exit-reject': 'approval-exit-reject 0.5s ease-out forwards',
        'approval-pulse-dot': 'approval-pulse-dot 2s ease-in-out infinite',
        'approval-ring-pop': 'approval-ring-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
        'approval-ring-expand': 'approval-ring-expand 1.5s ease-out 0.6s both',
        'approval-check-draw': 'approval-check-draw 0.4s ease-out 0.4s both',
        'approval-text-up-1': 'approval-text-up 0.4s ease-out 0.5s both',
        'approval-text-up-2': 'approval-text-up 0.4s ease-out 0.6s both',
        'approval-text-up-3': 'approval-text-up 0.4s ease-out 0.7s both',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Animation Delay Plugin
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'animation-delay': (value) => ({
            animationDelay: value,
          }),
        },
        {
          values: {
            0: '0ms',
            100: '100ms',
            200: '200ms',
            300: '300ms',
            400: '400ms',
            500: '500ms',
            600: '600ms',
            700: '700ms',
            800: '800ms',
            900: '900ms',
            1000: '1000ms',
          },
        }
      );
    },
  ],
};
