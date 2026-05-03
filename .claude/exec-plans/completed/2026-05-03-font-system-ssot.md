# Font System SSOT 정리 실행 계획

## 메타
- 생성: 2026-05-03T18:20:15+09:00
- 모드: Mode 2
- 슬러그: `font-system-ssot`
- 예상 변경: 약 18개 파일

## 설계 철학
폰트 계열, 용도별 별칭, 문서/라벨 출력용 fallback을 `packages/shared-constants`의 정책으로 승격해 프론트엔드, 백엔드, QR 라벨, 이메일, export 문서가 같은 결정을 공유하게 한다. 외부 폰트 다운로드에 의존하지 않는 CI/프로덕션 안정성을 유지하면서, 하드코딩된 font stack과 CSP 예외 드리프트를 제거한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| SSOT 위치 | `packages/shared-constants` | 프론트엔드/백엔드/Worker가 모두 접근 가능한 기존 공유 상수 패키지 |
| 폰트 소스 | 시스템 폰트 stack 우선 | 빌드/런타임에서 외부 font provider 의존성 제거, CSP 축소 가능 |
| 용도 모델 | sans/display/body/mono/document/label/email 계열 정책 | UI와 출력물의 요구가 다르므로 사용처별 의미를 보존 |
| 검증 방향 | 하드코딩 잔존 스캔 + 타입/빌드/대상 테스트 | SSOT 회귀를 기계적으로 확인 가능하게 함 |

## 구현 Phase

### Phase 1: 공유 폰트 정책 SSOT 신설
**목표:** 애플리케이션 전역의 font family, CSS stack 문자열, 문서/이메일/라벨 출력용 alias를 공유 상수로 제공한다.

**변경 파일:**
1. `packages/shared-constants/src/font-policy.ts` — 신규. UI, 문서, QR 라벨, 이메일, PDF/XLSX가 참조할 폰트 정책과 타입을 정의한다.
2. `packages/shared-constants/src/index.ts` — 수정. 폰트 정책을 패키지 public API로 export한다.
3. `packages/shared-constants/src/qr-config.ts` — 수정. QR 라벨 font stack을 로컬 리터럴이 아니라 공유 폰트 정책에서 파생한다.

**검증:** `pnpm --filter @equipment-management/shared-constants run type-check` 또는 패키지에 type-check 스크립트가 없으면 `pnpm tsc --noEmit`

### Phase 2: 프론트엔드 CSS/Tailwind 토큰 연결
**목표:** `globals.css`의 Tailwind font token이 공유 폰트 정책과 같은 값을 사용하며, 로컬 font stack 리터럴이 남지 않게 한다.

**변경 파일:**
1. `apps/frontend/styles/globals.css` — 수정. `--font-*` 토큰을 공유 정책과 동기화 가능한 형태로 정리한다.
2. `apps/frontend/lib/design-tokens/primitives.ts` — 수정. typography primitives가 font family 정책을 참조할 수 있는 기반을 제공한다.
3. `apps/frontend/lib/design-tokens/brand.ts` — 수정. `FONT` 계열 helper가 공유 정책 기반 alias와 충돌하지 않게 정리한다.
4. `apps/frontend/lib/design-tokens/index.ts` — 수정. 필요한 경우 font token helper를 public design-token API로 노출한다.
5. `apps/frontend/lib/design-tokens/__tests__/font-policy.test.ts` — 신규. 프론트 디자인 토큰과 공유 폰트 정책의 동기화를 검증한다.

**검증:** `pnpm --filter frontend run type-check`, `pnpm --filter frontend run test -- font-policy`

### Phase 3: QR 라벨 PDF font stack 정리
**목표:** OffscreenCanvas 라벨 렌더링이 공유 QR/label font policy를 사용하고, 관리번호/장비명/일련번호 가독성과 기존 auto-fit 동작을 유지한다.

**변경 파일:**
1. `apps/frontend/lib/qr/generate-label-pdf.worker.ts` — 수정. 라벨 렌더링에서 `LABEL_CONFIG.cell.fontStack` 또는 공유 정책 alias만 사용한다.
2. `packages/shared-constants/src/qr-config.ts` — Phase 1 변경과 함께 QR 라벨 정책의 SSOT 역할을 유지한다.

**검증:** `pnpm --filter frontend run test -- qr`, `pnpm --filter frontend run type-check`

### Phase 4: 백엔드 이메일/export 문서 폰트 정리
**목표:** 이메일 HTML, PDFKit, ExcelJS, DOCX XML helper, 도메인별 export renderer가 공유 문서 폰트 정책을 사용하고 한국어 출력 회귀를 막는다.

**변경 파일:**
1. `apps/backend/src/modules/notifications/services/email-template.service.ts` — 수정. 이메일 body font-family를 공유 email font stack으로 전환한다.
2. `apps/backend/src/modules/notifications/services/__tests__/email-template.service.spec.ts` — 수정. 특정 폰트명 단일 기대값 대신 공유 정책 준수를 검증한다.
3. `apps/backend/src/modules/reports/report-export.service.ts` — 수정. PDF/Excel export의 font 사용을 공유 문서 정책과 맞춘다.
4. `apps/backend/src/modules/reports/__tests__/report-export.service.spec.ts` — 수정. PDF/Excel font 정책 적용을 회귀 테스트한다.
5. `apps/backend/src/common/docx/docx-template.util.ts` — 수정. DOCX XML 폰트 강제값을 공유 문서 정책으로 정리한다.
6. `apps/backend/src/modules/cables/services/cable-path-loss-renderer.service.ts` — 수정. ExcelJS renderer의 font 지정이 공유 정책과 어긋나지 않게 한다.
7. `apps/backend/src/modules/data-migration/services/excel-parser.service.ts` — 수정. 마이그레이션 템플릿/리포트 Excel header font 지정도 공유 문서 정책을 사용한다.

**검증:** `pnpm --filter backend run test -- email-template`, `pnpm --filter backend run test -- report-export`, `pnpm --filter backend run type-check`

### Phase 5: CSP와 외부 폰트 의존성 정리
**목표:** 외부 Google Fonts를 사용하지 않는 정책과 CSP가 일치하도록 정리하고, 필요 없는 font/style 예외를 제거한다.

**변경 파일:**
1. `apps/frontend/proxy.ts` — 수정 가능. 프론트 CSP `font-src`/`style-src`가 새 폰트 정책과 충돌하지 않는지 정리한다.
2. `apps/backend/src/common/middleware/helmet-config.ts` — 수정 가능. Google Fonts 허용이 더 이상 필요 없으면 제거한다.
3. `apps/frontend/next.config.js` — 수정 가능. CSP 책임 경계 주석이 새 정책과 모순되지 않게 유지한다.

**검증:** `pnpm --filter frontend run type-check`, `pnpm --filter backend run type-check`, CSP 관련 backend/frontend 테스트가 있으면 대상 테스트 실행

### Phase 6: 최종 검증과 하드코딩 스캔
**목표:** 타입/빌드/테스트와 잔존 font hardcoding scan을 통과해 SSOT 정리가 완료되었음을 확인한다.

**변경 파일:**
1. `scripts/check-font-policy-sync.mjs` — 신규. Tailwind font token/CSP가 공유 폰트 정책과 drift되지 않도록 prebuild 검증을 제공한다.
2. `package.json` — 수정. 기존 prebuild 검증 체인에 font policy sync 검증을 추가한다.

**검증:**
```bash
node scripts/check-font-policy-sync.mjs
pnpm tsc --noEmit
pnpm --filter frontend run type-check
pnpm --filter backend run type-check
pnpm --filter frontend run test -- font-policy
pnpm --filter backend run test -- email-template
pnpm --filter backend run test -- report-export
pnpm --filter frontend run build
pnpm --filter backend run build
rg -n "font-family:|fontStack:|font\\('|fontFamily|Helvetica|Arial|Malgun Gothic|맑은 고딕|Noto Sans KR|Google Fonts|fonts.googleapis|fonts.gstatic" apps packages --glob '!**/node_modules/**'
```

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|------|------|
| `packages/shared-constants/src/font-policy.ts` | 전역 폰트 정책 SSOT |
| `apps/frontend/lib/design-tokens/__tests__/font-policy.test.ts` | 디자인 토큰/공유 정책 동기화 회귀 테스트 |
| `scripts/check-font-policy-sync.mjs` | 빌드 전 폰트 정책 drift 검증 |

### 수정
| 파일 | 변경 의도 |
|------|-----------|
| `packages/shared-constants/src/index.ts` | 폰트 정책 public export |
| `packages/shared-constants/src/qr-config.ts` | QR 라벨 font stack SSOT 연결 |
| `apps/frontend/styles/globals.css` | Tailwind font token과 공유 정책 정렬 |
| `apps/frontend/lib/design-tokens/primitives.ts` | typography primitive에서 font policy 참조 기반 제공 |
| `apps/frontend/lib/design-tokens/brand.ts` | font helper alias 정렬 |
| `apps/frontend/lib/design-tokens/index.ts` | font token helper export |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | QR 라벨 렌더링 font policy 준수 |
| `apps/backend/src/modules/notifications/services/email-template.service.ts` | 이메일 font-family SSOT 적용 |
| `apps/backend/src/modules/notifications/services/__tests__/email-template.service.spec.ts` | 이메일 폰트 정책 테스트 갱신 |
| `apps/backend/src/modules/reports/report-export.service.ts` | PDF/Excel export 폰트 정책 적용 |
| `apps/backend/src/modules/reports/__tests__/report-export.service.spec.ts` | export 폰트 정책 테스트 |
| `apps/backend/src/common/docx/docx-template.util.ts` | DOCX 문서 폰트 정책 정렬 |
| `apps/backend/src/modules/cables/services/cable-path-loss-renderer.service.ts` | Excel renderer 폰트 정책 정렬 |
| `apps/backend/src/modules/data-migration/services/excel-parser.service.ts` | Excel header 폰트 정책 정렬 |
| `apps/frontend/proxy.ts` | CSP font/style 정책 정리, 해당 시 |
| `apps/backend/src/common/middleware/helmet-config.ts` | Google Fonts CSP 예외 제거, 해당 시 |
| `apps/frontend/next.config.js` | CSP 책임 경계 주석 정리, 해당 시 |
| `package.json` | prebuild 검증 체인에 font policy sync 추가 |

## 의사결정 로그
- 2026-05-03T18:20:15+09:00 — 사용자 요청에 따라 Mode 2 Planner 산출물만 작성하고 애플리케이션 소스 변경은 제외한다.
- 2026-05-03T18:20:15+09:00 — 폰트 정책은 프론트 전용 design token이 아니라 백엔드 이메일/export와 QR Worker까지 공유해야 하므로 `packages/shared-constants`를 SSOT로 지정한다.
- 2026-05-03T18:20:15+09:00 — Google Fonts/CSP 정리는 실제 외부 폰트 의존성 제거 여부에 따라 적용 범위를 결정하도록 `해당 시` 변경으로 둔다.
- 2026-05-03T18:27:00+09:00 — CSS가 TypeScript 상수를 직접 import할 수 없는 경계는 RootLayout 런타임 CSS 변수 주입과 prebuild drift 검증으로 닫는다.
