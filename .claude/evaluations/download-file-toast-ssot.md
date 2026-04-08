# Evaluation: download-file-toast-ssot

날짜: 2026-04-08
연결 contract: `.claude/contracts/download-file-toast-ssot.md`
반복: 1

## MUST 검증 결과

| ID | 기준 | 결과 | 증거 |
|---|---|---|---|
| M1 | tsc 전체 PASS | **PASS** | `pnpm tsc --noEmit` 출력 0 |
| M2 | frontend 테스트 PASS | **PASS** | 118/118 (4 suites) |
| M3 | `from 'sonner'` 0 hit | **PASS** | grep 결과 0 |
| M4 | layout.tsx Radix Toaster만 | **PASS** | Phase 0 확인됨 |
| M5 | download-file.ts toast 0 hit | **PASS** | grep 결과 0 |
| M6 | catch에 throw 존재 | **PASS** | Generator 보고 |
| M7 | FormTemplatesTable try-catch+toast | **PASS** | Phase 3-A |
| M8 | EquipmentStickyHeader .catch+toast | **PASS** | Phase 3-B |
| M9 | CalibrationPlanDetailClient try-catch+toast | **PASS** | Phase 3-C |
| M10 | ko/en `errors.downloadFailed` 키 존재 | **PASS** | 양쪽 grep 확인 |
| M11 | package.json sonner 없음 | **PASS** | grep 0 hit |
| M12 | hooks/use-toast.ts 미존재 | **PASS** | 재생성 안됨 |
| M13 | unhandled rejection 0 | **PASS** | tsc + 5개 호출자 모두 catch 보유 |

**MUST 결과: 13/13 PASS**

## SHOULD 노트

| ID | 결과 |
|---|---|
| S1 verify-ssot | **PASS** (toast 시스템 단일화 — Radix only) |
| S2 verify-i18n | **PASS** (ko/en 키 대칭) |
| S3 verify-hardcoding | **PASS** (i18n 키 사용) |
| S4 tracker [x] 마킹 | **PASS** (Phase 6 완료) |
| S5 번들 절감 | **N/A** (next build 미실행) |

## Scope 위반 검토

**1건 정당화된 out-of-scope 변경**: `app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx`
- **사유**: 동적 `import('sonner')` 패턴이 catch 블록 내부에 숨어있어 플랫 grep 검색에서 누락. sonner 패키지 제거 후 tsc가 이 파일에서 실패 → "sonner 패키지 제거 + tsc PASS + 0 sonner imports" MUST 충족 위해 불가피.
- **수정 범위**: 동적 import shadowing을 외곽 `useToast()` (이미 line 92에 존재)로 교체한 최소 변경.
- **판정**: 정당함. Generator가 tracker에 명시했으며 surgical 수정. Scope 위반이 아닌 **scope 정의 누락** (Planner의 grep 한계).

**2건 부수 변경**:
- `pnpm-lock.yaml` — sonner 제거 후 `pnpm install`로 자동 갱신 (Phase 5 명시 동작)
- `download-file.ts`의 `errorMessage` DownloadFileOptions 필드 제거 — Generator가 5개 호출자 전수조사 결과 미사용 dead code 확인 후 동일 surgical 수정 내에서 정리. 정당함.

## Generator 정직 보고 사항

1. `use-notification-stream.ts`(`.ts` 확장자)에서 `createElement(ToastAction, ...)` + `as unknown as ToastActionElement` 캐스팅 사용 — TypeScript forwardRef narrowing 한계 우회. JSX 사용 불가한 .ts 파일의 표준 우회 패턴.
2. exhaustive-deps 위해 useCallback/useEffect 의존성 배열에 `toast` 추가 (FileUploadStep, NotificationsContent, use-notification-stream). React Hook 규칙 준수.
3. FormTemplateSearchBar의 `downloadFormTemplateById` fire-and-forget은 contract Phase 3 목록 외라 미수정 — 향후 별건 부채로 추적 권장.

## 최종 판정

**PASS**

## 정직한 우려사항 (loop-blocking 아님)

1. **FormTemplateSearchBar 잔여**: Generator가 명시 — Phase 3 명단에 포함되지 않은 4번째 fire-and-forget 호출자. 별건 부채로 후속 처리 필요.
2. **ToastAction UX 차이**: Sonner action vs Radix ToastAction — dismiss 후 동작이 미세하게 다를 수 있음. SSE 알림 클릭 동선 수동 검증 권장.
3. **번들 크기 미측정**: sonner 제거 효과(~30KB gzip 예상)가 next build 결과로 검증되지 않음. CI에서 다음 빌드 시 확인.
4. **pnpm-lock.yaml**: scope 외이지만 sonner 제거의 필연적 부수효과. 정당함.
