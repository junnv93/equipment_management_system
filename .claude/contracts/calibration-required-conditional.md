---
slug: calibration-required-conditional
created: 2026-04-06
mode: 1
---

# Contract: 교정필요여부에 따른 교정정보 섹션 조건부 로직

## MUST Criteria

- [ ] `calibrationRequired === 'not_required'`일 때 교정정보 섹션 필드 비활성화/숨김 처리
- [ ] `calibrationRequired === 'not_required'`일 때 `managementMethod`를 `not_applicable`로 자동 설정
- [ ] `calibrationRequired === 'required'`일 때 `needsIntermediateCheck`를 `true`로 자동 설정
- [ ] `calibrationRequired` 미선택 시 교정정보 섹션 필드 비활성화 (선택 유도)
- [ ] `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] `pnpm --filter frontend run build` 통과
- [ ] 기존 CalibrationInfoSection 기능 (자동 계산 등) 정상 유지

## SHOULD Criteria

- [ ] 교정 불필요 시 안내 메시지 표시 (UX)
- [ ] `calibrationRequired` 변경 시 관련 필드 초기화 (stale data 방지)
