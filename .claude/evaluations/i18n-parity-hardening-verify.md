---
session: i18n-parity-hardening
date: 2026-04-28
verifier: verify-implementation (manual execution)
scope: 본 세션 변경 파일만 (i18n-parity-hardening)
---

# 구현 검증 보고서 (본 세션 한정)

| 검증 스킬             | 상태  | 이슈 수 | 상세                                                                 |
| --------------------- | ----- | ------- | -------------------------------------------------------------------- |
| verify-i18n           | PASS  | 0       | Step 1~5·16 모두 통과. ICU 불일치 1건은 INFO 등급 (select value 번역) |
| verify-ssot           | PASS  | 0       | loadingLabel SSOT 단일 정의, client.ts 잔재 0, LOCALES 배열 계약 일치 |
| verify-hardcoding     | PASS  | 0       | JSX 인라인 한글/영문 0건, API endpoint 하드코딩 0건, queryKey 0건     |
| verify-frontend-state | PASS  | 0       | loadingLabel required 일관성, hooks 무조건 호출, 바인딩 충돌 없음     |

**발견된 총 이슈: 0개**

---

## 상세 검증 결과

### verify-i18n

| Step | 검사                                 | 상태 | 상세                                                                           |
| ---- | ------------------------------------ | ---- | ------------------------------------------------------------------------------ |
| 1    | en/ko 파일 쌍 존재                   | PASS | equipment.json, non-conformances.json, qr.json 양쪽 존재                       |
| 2    | 도메인별 키 쌍 일치                   | PASS | equipment(1434), non-conformances(448), qr(134) 완전 일치                      |
| 3    | 빈 번역 값                            | PASS | en/ko 3개 파일 모두 빈 값 0건                                                  |
| 5    | ICU 변수 쌍 일치                      | INFO | equipment.sharedBanner.temporaryDesc: ICU select values가 각 언어로 번역됨. 변수명 `source`는 양쪽 동일. INFO 등급 (FAIL 아님) |
| 16   | 호출지 ↔ messages JSON parity         | PASS | `node scripts/check-i18n-call-sites.mjs --all` — 802파일/20ns 검사, 누락 0건  |

### verify-ssot

- `loadingLabel: string` — NextStepPanel.tsx에 단일 정의, callers(CheckoutGroupCard, CheckoutDetailClient)에서 `tCommon('status.loading')` 주입
- `lib/i18n/client.ts` 삭제 후 import 잔재 0건 확인
- `scripts/check-i18n-call-sites.mjs`의 `LOCALES = ['ko', 'en']` — messages 디렉토리 실제 로케일과 일치
- 변경된 TSX 파일들: schemas·shared-constants 패키지에서만 enum/Permission import, 로컬 재정의 0건

### verify-hardcoding

- JSX render 내 `>[가-힣]` 패턴 0건 (한글은 모두 JSDoc/주석)
- API endpoint 하드코딩 0건
- queryKey 인라인 0건
- console.error 내 한글 1건 (`CheckoutHistoryTab.tsx:163`) — 사용자 미노출, 허용

### verify-frontend-state

- `NextStepPanel` `loadingLabel: string` (required) — caller 2개 모두 `tCommon('status.loading')` 전달
- `YourTurnBadge`(내부 함수)와 `NextStepPanel`(export) 각각 `useTranslations('checkouts.fsm')` 독립 호출 — hooks 규칙 준수
- `CheckoutDetailClient.tsx`: `t`, `tEquipment`, `tCommon` 3개 바인딩 — 충돌 없음, 각 ns 독립
- `CheckoutGroupCard.tsx`: `t`, `tCommon` 2개 바인딩 — 충돌 없음
- `NonConformanceBanner.tsx`: `tNc`(non-conformances ns), `tBanner`(equipment.nonConformanceBanner ns) 분리 확인

### 신규 키 검증

- `calibration.register.unauthorized.description` — en/ko 모두 존재
- `equipment.form.fieldLabels.lastCalibrationDate`, `.calibrationAgency` — en/ko 모두 존재
- `equipment.detail.viewDetailShort` — en/ko 모두 존재
- `qr.qrDisplay.error` — en/ko 모두 존재 (string 단일 키)
- `equipment.sharedBanner.*` (4키), `equipment.nonConformanceBanner.statusWarningTitle/Desc` (2키) — en/ko 완전 parity
