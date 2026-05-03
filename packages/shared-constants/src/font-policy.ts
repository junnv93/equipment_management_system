/**
 * Font policy SSOT.
 *
 * Web UI, QR rendering, email HTML, and generated documents consume these
 * constants instead of redefining font stacks locally.
 */

export const FONT_FAMILY = {
  koreanPrimary: 'Noto Sans KR',
  koreanWindows: 'Malgun Gothic',
  koreanWindowsLocalized: '맑은 고딕',
  koreanApple: 'Apple SD Gothic Neo',
  koreanLegacy: '나눔고딕',
  display: 'DM Sans',
  body: 'IBM Plex Sans',
  mono: 'JetBrains Mono',
  inter: 'Inter',
  docxTemplateKorean: '굴림체',
  signatureFallback: 'serif',
  pdfCoreRegular: 'Helvetica',
  pdfCoreBold: 'Helvetica-Bold',
} as const;

const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'system-ui',
  'ui-sans-serif',
  'ui-monospace',
]);

const quoteCssFontFamily = (family: string): string => {
  if (GENERIC_FONT_FAMILIES.has(family) || /^[A-Za-z0-9-]+$/.test(family)) {
    return family;
  }

  return `"${family.replace(/"/g, '\\"')}"`;
};

export const toCssFontFamily = (families: readonly string[]): string =>
  families.map(quoteCssFontFamily).join(', ');

export const FONT_STACKS = {
  webSans: [
    FONT_FAMILY.koreanPrimary,
    FONT_FAMILY.inter,
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ],
  webDisplay: [
    FONT_FAMILY.display,
    FONT_FAMILY.koreanPrimary,
    FONT_FAMILY.inter,
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ],
  webBody: [
    FONT_FAMILY.body,
    FONT_FAMILY.koreanPrimary,
    FONT_FAMILY.inter,
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ],
  webMono: [FONT_FAMILY.mono, 'ui-monospace', 'SFMono-Regular', 'monospace'],
  koreanUi: [
    FONT_FAMILY.koreanWindowsLocalized,
    FONT_FAMILY.koreanWindows,
    FONT_FAMILY.koreanApple,
    FONT_FAMILY.koreanPrimary,
    FONT_FAMILY.koreanLegacy,
    'sans-serif',
  ],
  email: [FONT_FAMILY.koreanWindows, FONT_FAMILY.koreanWindowsLocalized, 'sans-serif'],
} as const;

export const CSS_FONT_STACKS = {
  sans: toCssFontFamily(FONT_STACKS.webSans),
  display: toCssFontFamily(FONT_STACKS.webDisplay),
  body: toCssFontFamily(FONT_STACKS.webBody),
  mono: toCssFontFamily(FONT_STACKS.webMono),
  koreanUi: toCssFontFamily(FONT_STACKS.koreanUi),
  email: toCssFontFamily(FONT_STACKS.email),
} as const;

export const FONT_CSS_VARIABLE_NAMES = {
  sans: '--ems-font-sans',
  display: '--ems-font-display',
  body: '--ems-font-body',
  mono: '--ems-font-mono',
} as const;

export const FONT_CSS_VARIABLES = {
  [FONT_CSS_VARIABLE_NAMES.sans]: CSS_FONT_STACKS.sans,
  [FONT_CSS_VARIABLE_NAMES.display]: CSS_FONT_STACKS.display,
  [FONT_CSS_VARIABLE_NAMES.body]: CSS_FONT_STACKS.body,
  [FONT_CSS_VARIABLE_NAMES.mono]: CSS_FONT_STACKS.mono,
} as const;

export const FONT_USAGE_CLASSES = {
  heading: 'font-display',
  body: 'font-body',
  mono: 'font-mono tabular-nums',
  kpi: 'font-mono tabular-nums font-semibold',
} as const;

export const DOCUMENT_FONT_POLICY = {
  excel: {
    korean: {
      name: FONT_FAMILY.koreanWindowsLocalized,
      charset: 129,
    },
  },
  email: {
    bodyFontFamily: CSS_FONT_STACKS.email,
  },
  docx: {
    templateRunFontsXml: `<w:rFonts w:ascii="${FONT_FAMILY.docxTemplateKorean}" w:eastAsia="${FONT_FAMILY.docxTemplateKorean}" w:hAnsi="${FONT_FAMILY.docxTemplateKorean}"/>`,
  },
  pdf: {
    coreRegular: FONT_FAMILY.pdfCoreRegular,
    coreBold: FONT_FAMILY.pdfCoreBold,
  },
} as const;

export const buildDocxRunPropertiesXml = (halfPointSize: number): string =>
  `<w:rPr>${DOCUMENT_FONT_POLICY.docx.templateRunFontsXml}<w:sz w:val="${halfPointSize}"/></w:rPr>`;
