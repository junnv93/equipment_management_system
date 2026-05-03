# Evaluation Report: Font System SSOT

## 반복 #1 (2026-05-03T18:35:45+09:00)

## 계약 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| `packages/shared-constants`가 UI, 문서, 이메일, QR 라벨, mono 용도의 폰트 정책을 public API로 제공 | PASS | `packages/shared-constants/src/font-policy.ts`에 `FONT_FAMILY`, `FONT_STACKS`, `CSS_FONT_STACKS`, `FONT_CSS_VARIABLES`, `FONT_USAGE_CLASSES`, `DOCUMENT_FONT_POLICY`가 있고 `src/index.ts`에서 export됨 |
| `qr-config.ts`의 QR 라벨 font stack은 공유 폰트 정책에서 파생 | PASS | `LABEL_CONFIG.cell.fontStack: CSS_FONT_STACKS.koreanUi`; 기존 로컬 font stack 리터럴 제거 |
| `globals.css`의 `--font-sans/display/body/mono` 값은 공유 정책과 의미상 동일 | PASS | `@theme inline`에서 `var(--ems-font-*)`만 참조하고 실제 값은 RootLayout runtime style로 주입 |
| `apps/frontend/lib/design-tokens` font helper가 별도 font family SSOT를 만들지 않음 | PASS | `brand.ts`의 `FONT`는 `FONT_USAGE_CLASSES`만 참조. `approval.ts`의 DM Sans 주석도 일반 display font 설명으로 교체됨 |
| QR 라벨 Worker는 자체 font family 리터럴 대신 `LABEL_CONFIG` 또는 공유 policy alias 사용 | PASS | `generate-label-pdf.worker.ts`는 `cell.fontStack`/`LABEL_CONFIG.cell.fontStack`만 사용 |
| 백엔드 이메일 HTML의 `font-family`는 공유 email/document font policy를 따름 | PASS | `email-template.service.ts` body inline style이 `DOCUMENT_FONT_POLICY.email.bodyFontFamily` 사용 |
| 백엔드 PDF/Excel/DOCX/export renderer font 사용은 공유 document font policy를 따름 | PASS | DOCX는 `DOCUMENT_FONT_POLICY.docx`/`buildDocxRunPropertiesXml`, Excel은 `DOCUMENT_FONT_POLICY.excel.korean`, PDFKit core fonts는 `DOCUMENT_FONT_POLICY.pdf` 사용 |
| Google Fonts 미사용 정책이면 CSP에서 `fonts.googleapis.com`/`fonts.gstatic.com` 제거 | PASS | `helmet-config.ts`에서 style/font CSP 외부 font host 제거. 전체 소스 검색상 실제 source 변경 경로에 신규 허용 없음 |
| `next/font/google`, `fonts.googleapis.com`, `fonts.gstatic.com` 신규 의존성 없음 | PASS | `rg` 전체 검색 결과는 기존 문서 `docs/development/NEXTJS_16_GUIDE.md`의 예시뿐이며 변경 diff에는 신규 추가 없음 |
| `node scripts/check-font-policy-sync.mjs` 성공 | PASS | exit 0 |
| 폰트 hardcoding 잔존 스캔에서 새 중복 font stack 없음 | PASS | 변경 diff의 font 리터럴은 제거 또는 SSOT 참조로 대체됨. 잔존 `scripts/generate-pwa-icons.mjs`의 SVG `system-ui, -apple-system, sans-serif`는 변경 파일이 아닌 기존 스크립트 |
| `pnpm tsc --noEmit` 성공 | PASS | exit 0 |
| `pnpm --filter frontend run type-check` 성공 | PASS | exit 0 |
| `pnpm --filter backend run type-check` 성공 | PASS | exit 0 |
| `pnpm --filter frontend run build` 성공 | PASS | Next.js 16.2.3 production build exit 0 |
| `pnpm --filter backend run build` 성공 | PASS | `nest build` exit 0 |
| 대상 테스트: `pnpm --filter frontend run test -- font-policy` 성공 | PASS | 1 suite, 2 tests passed |
| 대상 테스트: `pnpm --filter backend run test -- email-template` 성공 | PASS | 1 suite, 19 tests passed |
| 대상 테스트: `pnpm --filter backend run test -- report-export` 성공 | PASS | 1 suite, 12 tests passed |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | PASS | 별도 에이전트 실행은 없었으나 수동 정적 검토 기준 Critical 없음 |
| verify-hardcoding font family/Google Fonts URL/CSS font stack 신규 위반 0개 | PASS | 변경 diff 기준 신규 중복 없음. 기존 문서 예시와 기존 PWA 아이콘 스크립트는 이번 변경 신규 위반 아님 |
| QR 라벨 PDF 샘플 또는 기존 QR 관련 테스트에서 한국어 렌더링 회귀 없음 | PASS | Worker가 기존 `LABEL_CONFIG.cell.fontStack` 경유를 유지하고 동일한 한국어 fallback stack을 SSOT에서 받음. 별도 QR visual 샘플은 실행하지 않음 |
| 이메일 템플릿 테스트가 특정 OS 전용 폰트 하나에만 결합되지 않음 | PASS | 테스트가 `DOCUMENT_FONT_POLICY.email.bodyFontFamily`를 검증 |
| CSP는 실제 폰트 로딩 모델과 일치 | PASS | 외부 Google Fonts 로딩 없이 self-only font policy와 일치 |
| 변경은 폰트 정책 정리에 필요한 파일로 제한 | WARN | font-system 변경 외에 calibration scope guard 관련 변경 파일들이 작업 트리에 함께 존재함. 다만 본 평가 대상 변경은 폰트 SSOT 경로와 구분 가능 |

## 전체 판정: PASS (필수 전체 충족)

## 이전 반복 대비 변화 (반복 #2 이상)
| 이슈 | 이전 판정 | 현재 판정 | 동일 이슈 연속? |
|------|----------|----------|---------------|
| 해당 없음 | - | - | - |

## 수정 지시 (FAIL 시)
해당 없음.
