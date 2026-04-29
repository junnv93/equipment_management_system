# Contract: label-config-scaling-pt2mm-i18n

Tech Debt W-3, pt→mm magic number, i18n size.* hardcoding 3종 해결.

## Slug
`label-config-scaling-pt2mm-i18n`

## Changed Files (expected)
- `packages/shared-constants/src/qr-config.ts`
- `apps/frontend/lib/qr/generate-label-pdf.worker.ts`
- `apps/frontend/messages/ko/qr.json`
- `apps/frontend/messages/en/qr.json`
- `apps/frontend/components/equipment/EquipmentQRButton.tsx`
- `.claude/skills/verify-qr-ssot/SKILL.md`

## MUST Criteria

### M1: TypeScript 컴파일 통과
```bash
pnpm --filter @equipment-management/shared-constants run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
```
**PASS:** exit code 0, 에러 없음.

### M2: LABEL_CONFIG.scaling 네임스페이스 존재
```bash
grep -n "scaling:" packages/shared-constants/src/qr-config.ts
grep -n "referenceLabelHeightMm" packages/shared-constants/src/qr-config.ts
```
**PASS:** `scaling:` 블록 존재, `referenceLabelHeightMm`이 `scaling` 아래에 위치.

### M3: cell.referenceLabelHeightMm 참조 제거
```bash
grep -rn "cell\.referenceLabelHeightMm" apps/frontend packages/shared-constants
```
**PASS:** 0건 (qr-config.ts 포함).

### M4: PT_TO_MM 상수 존재 및 0.353 제거
```bash
grep -n "PT_TO_MM" packages/shared-constants/src/qr-config.ts
grep -rn "0\.353" apps/frontend packages/shared-constants
```
**PASS:** PT_TO_MM 정의 존재, `0.353` 리터럴 0건.

### M5: i18n size.* 토큰화
```bash
grep -n '"size"' apps/frontend/messages/ko/qr.json
grep -A 10 '"size"' apps/frontend/messages/ko/qr.json
grep -A 10 '"size"' apps/frontend/messages/en/qr.json
```
**PASS:** `size.*` 값에 `{widthMm}` + `{heightMm}` 보간 토큰 존재, mm 수치 리터럴(예: 93.5, 43.7) 없음.

### M6: EquipmentQRButton.tsx size 번역 호출에 파라미터 주입
```bash
grep -n "size\.\${preset}" apps/frontend/components/equipment/EquipmentQRButton.tsx
grep -n "widthMm\|heightMm" apps/frontend/components/equipment/EquipmentQRButton.tsx
```
**PASS:** size preset 루프 내에 `LABEL_SIZE_PRESETS[preset]` 구조분해 + `{ widthMm, heightMm }` 번역 파라미터 전달.

### M7: verify-qr-ssot SKILL.md 업데이트
```bash
grep -n "cell\.referenceLabelHeightMm\|cell\." .claude/skills/verify-qr-ssot/SKILL.md
```
**PASS:** `cell.referenceLabelHeightMm` → `scaling.referenceLabelHeightMm` 업데이트 반영.

## SHOULD Criteria

### S1: PT_TO_MM 값 정확도
`25.4 / 72` 표현식 사용 (0.35277...) — `0.353` 반올림 대비 정밀도 향상.

### S2: qr-config.ts JSDoc 갱신
`XL_LABEL_HEIGHT_MM` const 상단 코멘트가 `LABEL_CONFIG.scaling.referenceLabelHeightMm`으로 업데이트.
