# 스프린트 계약: Font System SSOT

## 생성 시점
2026-05-03T18:20:15+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `packages/shared-constants`가 UI, 문서, 이메일, QR 라벨, mono 용도의 폰트 정책을 public API로 제공한다.
- [ ] `packages/shared-constants/src/qr-config.ts`의 QR 라벨 font stack은 공유 폰트 정책에서 파생되며 로컬 중복 리터럴을 갖지 않는다.
- [ ] `apps/frontend/styles/globals.css`의 `--font-sans`, `--font-display`, `--font-body`, `--font-mono` 값은 공유 폰트 정책과 의미상 동일하다.
- [ ] `apps/frontend/lib/design-tokens`의 font 관련 helper는 공유 폰트 정책과 충돌하는 별도 font family SSOT를 만들지 않는다.
- [ ] QR 라벨 Worker는 자체 font family 리터럴이 아니라 `LABEL_CONFIG` 또는 공유 정책 alias를 통해 font stack을 사용한다.
- [ ] 백엔드 이메일 HTML의 `font-family`는 공유 email/document font policy를 따른다.
- [ ] 백엔드 PDF/Excel/DOCX/export renderer의 font 사용은 공유 document font policy를 따른다.
- [ ] 외부 Google Fonts를 사용하지 않는 정책이라면 frontend/backend CSP에서 `fonts.googleapis.com` 및 `fonts.gstatic.com` 허용이 제거된다. 유지하는 경우에는 공유 정책에 근거가 명시되어야 한다.
- [ ] `next/font/google`, `fonts.googleapis.com`, `fonts.gstatic.com` 신규 의존성이 추가되지 않는다.
- [ ] `node scripts/check-font-policy-sync.mjs` 성공
- [ ] 폰트 hardcoding 잔존 스캔에서 허용된 SSOT 파일, 테스트 기대값, 라이브러리 내장 PDFKit standard font 이름을 제외한 새 중복 font stack이 없다.
- [ ] `pnpm tsc --noEmit` 성공
- [ ] `pnpm --filter frontend run type-check` 성공
- [ ] `pnpm --filter backend run type-check` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run build` 성공
- [ ] 대상 테스트 성공: `pnpm --filter frontend run test -- font-policy`
- [ ] 대상 테스트 성공: `pnpm --filter backend run test -- email-template`
- [ ] 대상 테스트 성공: `pnpm --filter backend run test -- report-export`

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] verify-hardcoding에서 font family, Google Fonts URL, CSS font stack 관련 신규 위반 0개
- [ ] QR 라벨 PDF 샘플 또는 기존 QR 관련 테스트에서 한국어 장비명/관리번호 렌더링 회귀가 없다.
- [ ] 이메일 템플릿 테스트가 특정 OS 전용 폰트 하나에만 결합되지 않고 정책 alias를 검증한다.
- [ ] CSP는 실제 폰트 로딩 모델과 일치하며 불필요한 외부 font provider 예외를 남기지 않는다.
- [ ] 변경은 폰트 정책 정리에 필요한 공유 상수, 프론트 토큰/CSS/QR, 백엔드 이메일/export/CSP 파일로 제한한다.

### 적용 verify 스킬
- verify-hardcoding
- verify-ssot
- review-architecture
- verify-frontend-state

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
