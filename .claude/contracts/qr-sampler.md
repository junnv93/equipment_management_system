# Contract: qr-sampler

## MUST Criteria

| # | Criterion | Verify |
|---|-----------|--------|
| M1 | LABEL_SAMPLER_LAYOUT, LABEL_SAMPLER_CONFIG, getSamplerPresetOrder() — qr-config.ts SSOT | grep |
| M2 | buildSamplerPdf() 존재, 'sampler' 모드 분기 처리 | grep |
| M3 | Worker sampler 로직이 getSamplerPresetOrder() 순회 — preset 리터럴 하드코딩 없음 | grep |
| M4 | buildSinglePdf/buildBatchPdf/renderCellToDataUrl 시그니처·동작 불변 | grep |
| M5 | printMode:'sampler'|'custom' 상태, 기본값 sampler, RadioGroup UI 존재, 조건부 렌더링 | grep |
| M6 | pnpm tsc --noEmit PASS | tsc |
| M7 | any/as any/ts-ignore 0건 | grep |
| M8 | ko/en qr.json 동일 키 구조 (sampler 관련 8개 키) | diff |

## SHOULD Criteria
| S1 | A4 overflow 없음 (계산 주석 포함) |
| S2 | progress 메시지 유지 |
| S3 | OffscreenCanvas preset별 재사용 |
| S4 | Worker i18n-free (헤더 문자열은 메인 스레드 주입) |
| S5 | 파일명: sampler-${managementNumber}-${date}.pdf |
