# Evaluation: i18n-hardcoded-korean

## Build Verification
- tsc --noEmit: PASS
- build: PASS (pre-verified)

## Contract Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| MUST-1 | LoginPageContent highlight 1 ('장비 등록 · 교정 · 반출 관리') | PASS | Line 212 uses `tBranding('highlights.${key}')` with key `equipmentManagement`; ko/auth.json line 43 has `"equipmentManagement": "장비 등록 · 교정 · 반출 관리"`, en/auth.json line 43 has English equivalent |
| MUST-2 | LoginPageContent highlight 2 ('역할 기반 승인 워크플로우') | PASS | Same i18n loop covers key `approvalWorkflow`; ko/auth.json line 44 has `"approvalWorkflow": "역할 기반 승인 워크플로우"`, en/auth.json line 44 has English equivalent |
| MUST-3 | FormWizardStepper aria labels ('완료', '현재', '오류', '미완료') | PASS | Lines 83-88 use `tStep('completed')`, `tStep('current')`, `tStep('error')`, `tStep('incomplete')`; ko/common.json lines 233-237 and en/common.json lines 233-237 both define all 4 keys under `stepStatus` |
| MUST-4 | EquipmentSelector placeholder ('장비명, 관리번호 검색...') | PASS | Line 66 uses `tEquipment('searchPlaceholder')`; ko/equipment.json line 1491 and en/equipment.json line 1491 both define `selector.searchPlaceholder` |
| MUST-5 | en/ko JSON key matching | PASS | auth.json: `branding.highlights` has identical key structure (equipmentManagement, approvalWorkflow, isoCompliance) in both locales. common.json: `stepStatus` has identical keys (completed, current, error, incomplete) in both. equipment.json: `selector.searchPlaceholder` present in both. |
| MUST-6 | tsc --noEmit | PASS | Ran `pnpm tsc --noEmit` with zero errors |
| MUST-7 | build | PASS | Pre-verified |

## Overall Verdict
PASS

## Issues Found
None. All 4 hardcoded Korean strings have been migrated to i18n keys with matching en/ko translations.
