# NC 상세 페이지 자기 완결성 구현

## 설계 철학
부적합(NC) 상세 페이지에서 다른 페이지로 이동하지 않고 NC 처리의 전체 워크플로우를 완료할 수 있도록 한다.
"수정" → NC 편집 모달, "수리이력등록" → NC 컨텍스트 내 수리 등록 모달로 전환.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| NC 편집 방식 | Dialog 모달 | 기존 종결/반려 다이얼로그와 일관성 유지 |
| 수리 등록 방식 | Dialog 모달 (NC 자동 연결) | IncidentHistoryTab의 수리 폼 로직 재사용, equipmentId + ncId 자동 설정 |
| `cause` 편집 가능 여부 | 백엔드 UpdateDto에 `cause` 추가 | `actionPlan`은 이미 가능, `cause`만 누락 — open 상태에서만 허용 |
| 수리 모달 폼 구조 | react-hook-form + zod (기존 패턴) | IncidentHistoryTab과 동일한 검증 구조 |

## 구현 Phase

### Phase 1: 백엔드 — UpdateDto에 `cause` 필드 추가
**목표:** NC의 원인(cause) 필드를 open 상태에서 수정 가능하게 함
**변경 파일:**
1. `apps/backend/src/modules/non-conformances/dto/update-non-conformance.dto.ts` — 수정: `cause` optional 필드 추가
**검증:** `pnpm --filter backend run tsc --noEmit`

### Phase 2: 프론트엔드 — NC 편집 모달 컴포넌트
**목표:** NC 기본 정보(원인, 조치계획)를 수정하는 모달 생성
**변경 파일:**
1. `apps/frontend/components/non-conformances/NCEditDialog.tsx` — 신규: cause + actionPlan 편집 다이얼로그
2. `apps/frontend/lib/api/non-conformances-api.ts` — 수정: UpdateNonConformanceDto에 `cause` 추가
**검증:** `pnpm --filter frontend run tsc --noEmit`

### Phase 3: 프론트엔드 — 수리이력 등록 모달 컴포넌트
**목표:** NC 상세에서 직접 수리 이력을 등록하고 해당 NC에 자동 연결하는 모달 생성
**변경 파일:**
1. `apps/frontend/components/non-conformances/NCRepairDialog.tsx` — 신규: 수리 등록 다이얼로그 (equipmentId + ncId 자동 설정, react-hook-form + zod)
**검증:** `pnpm --filter frontend run tsc --noEmit`

### Phase 4: NCDetailClient 통합 — 헤더 버튼 + 링크 수정
**목표:** "수정" 버튼과 "수리이력등록" 링크를 모달 트리거로 전환
**변경 파일:**
1. `apps/frontend/components/non-conformances/NCDetailClient.tsx` — 수정: 헤더 "수정" → NCEditDialog 열기, "수리이력등록" → NCRepairDialog 열기, 전제조건 안내 링크 → 모달 트리거
**검증:** `pnpm --filter frontend run tsc --noEmit`

### Phase 5: i18n 키 추가
**목표:** 새 모달의 한/영 번역 키 추가
**변경 파일:**
1. `apps/frontend/messages/ko/non-conformances.json` — 수정: editDialog, repairDialog 키 추가
2. `apps/frontend/messages/en/non-conformances.json` — 수정: editDialog, repairDialog 키 추가
**검증:** `pnpm --filter frontend run build`

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `components/non-conformances/NCEditDialog.tsx` | NC 기본 정보 편집 모달 |
| `components/non-conformances/NCRepairDialog.tsx` | NC 컨텍스트 수리 등록 모달 |

### 수정
| 파일 | 변경 의도 |
|------|-----------|
| `dto/update-non-conformance.dto.ts` | `cause` 필드 추가 |
| `non-conformances-api.ts` | DTO에 `cause` 추가 |
| `NCDetailClient.tsx` | 헤더 버튼/링크를 모달 트리거로 전환 |
| `messages/ko/non-conformances.json` | 한국어 번역 키 추가 |
| `messages/en/non-conformances.json` | 영어 번역 키 추가 |
