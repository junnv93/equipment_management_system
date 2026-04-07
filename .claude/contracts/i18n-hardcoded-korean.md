# Contract: i18n-hardcoded-korean

## Scope
프론트엔드 컴포넌트에 하드코딩된 한국어 문자열 4건을 messages/{en,ko}/*.json으로 이동

## MUST Criteria
- [ ] LoginPageContent.tsx:201 '장비 등록 · 교정 · 반출 관리' → i18n 키 사용
- [ ] LoginPageContent.tsx:202 '역할 기반 승인 워크플로우' → i18n 키 사용
- [ ] FormWizardStepper.tsx:81 '완료' (및 '현재', '오류', '미완료') → i18n 키 사용
- [ ] EquipmentSelector.tsx:64 '장비명, 관리번호 검색...' → i18n 키 사용
- [ ] en/ko JSON 키 매칭 (verify-i18n PASS)
- [ ] `pnpm tsc --noEmit` PASS
- [ ] `pnpm --filter frontend run build` PASS

## SHOULD Criteria
- [ ] 기존 i18n 키 네이밍 컨벤션 준수
- [ ] 불필요한 새 네임스페이스 생성 안 함
