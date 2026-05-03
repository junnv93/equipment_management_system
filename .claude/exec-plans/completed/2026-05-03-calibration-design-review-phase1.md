# 교정/교정계획 디자인 리뷰 1차 구현 계획

## 메타
- 생성: 2026-05-03T00:00:00+09:00
- 모드: Mode 2
- 예상 변경: 13개 파일

## 설계 철학
리뷰 문서의 P1/P2 항목 중 기존 API와 데이터 모델로 구현 가능한 화면 구조 개선을 먼저 반영한다. OCR, 측정 템플릿, 항목별 의견 저장처럼 백엔드 계약이 필요한 기능은 명시적 후속 단계로 분리한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 교정관리 월별 뷰 | 기존 `startDate`/`endDate` URL 필터로 연결 | 신규 `month` 파라미터보다 기존 SSOT 필터 훅과 백엔드 쿼리를 재사용 |
| 교정계획 목록 | 기존 목록 API 데이터에서 카드/Your Turn 파생 | 신규 `awaiting-me` API 없이 권한과 상태로 우선 UX 개선 가능 |
| 교정성적서 OCR | 이번 단계 제외 | 파일 파싱, 저장 모델, 기관별 룰이 필요한 별도 백엔드 기능 |
| 측정값 자동 판정 | UI 안내/계획만 반영 | 측정 항목 템플릿 SSOT가 아직 없어 임의 모델 생성 방지 |

## 구현 Phase
### Phase 1: 교정관리 시간 축과 행 액션
**목표:** 시험실무자가 이번 달/다음 달 도래 장비와 등록 액션을 빠르게 찾는다.
**변경 파일:**
1. `apps/frontend/components/calibration/MonthlyCalibrationCalendar.tsx` — 신규 월별 6개월 캘린더 컴포넌트
2. `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx` — 월별 캘린더 연결, 날짜/상태 필터를 이력 API에 반영
3. `apps/frontend/components/calibration/CalibrationStatsCards.tsx` — KPI 우선순위 재배치
4. `apps/frontend/components/calibration/CalibrationListTable.tsx` — 상태별 hover 액션
5. `apps/frontend/messages/{ko,en}/calibration.json` — 새 라벨 추가
**검증:** `pnpm --filter frontend run type-check`

### Phase 2: 교정계획 목록 결재 큐
**목표:** 책임자가 본인 차례인 계획과 진행 단계를 목록에서 식별한다.
**변경 파일:**
1. `apps/frontend/components/calibration-plans/PlanStatusBadge.tsx` — 4-dot micro stepper 포함
2. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` — Your Turn 큐와 카드/표 토글
3. `apps/frontend/messages/{ko,en}/calibration.json` — 새 라벨 추가
**검증:** `pnpm --filter frontend run type-check`

### Phase 3: 교정계획 상세 결재 맥락
**목표:** 상세 첫 화면에서 현재 사용자 액션과 계획 메타를 즉시 인지한다.
**변경 파일:**
1. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — Approval Bar, MetaGrid, 반려 배너 강화
2. `apps/frontend/messages/{ko,en}/calibration.json` — 새 라벨 추가
**검증:** `pnpm --filter frontend run type-check`

### Phase 4: 교정성적서 등록 폼 안내 구조
**목표:** 등록 후 흐름, 자동 계산 필드, 결과 후속 조치를 폼 안에서 명확히 보여준다.
**변경 파일:**
1. `apps/frontend/components/calibration/CalibrationForm.tsx` — 단계형 섹션, 자동 계산 chip, 결과 segmented UI, sticky action bar
2. `apps/frontend/messages/{ko,en}/calibration.json` — 새 라벨 추가
**검증:** `pnpm --filter frontend run type-check`

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `apps/frontend/components/calibration/MonthlyCalibrationCalendar.tsx` | 6개월 시간 축을 교정관리 페이지의 주요 탐색 UI로 제공 |

### 수정
| 파일 | 변경 의도 |
|------|-----------|
| `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx` | 날짜 필터와 월별 캘린더 연결 |
| `apps/frontend/components/calibration/CalibrationStatsCards.tsx` | KPI 정보 우선순위 조정 |
| `apps/frontend/components/calibration/CalibrationListTable.tsx` | 행 액션 노이즈 감소 |
| `apps/frontend/components/calibration/CalibrationForm.tsx` | 등록 흐름과 자동 계산 신호 강화 |
| `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` | 결재자 중심 목록 구조 |
| `apps/frontend/components/calibration-plans/PlanStatusBadge.tsx` | 진행 단계 시각화 |
| `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` | 상세 결재 맥락 강화 |
| `apps/frontend/messages/ko/calibration.json` | 한국어 라벨 |
| `apps/frontend/messages/en/calibration.json` | 영어 라벨 |
| `.claude/contracts/REGISTRY.md` | 활성 contract 등록 |
| `.claude/contracts/calibration-design-review-phase1.md` | 평가 계약 |

## 의사결정 로그
- 2026-05-03: 외부 리뷰 4개 문서에서 P1/P2를 추출했다.
- 2026-05-03: 신규 백엔드가 필요한 OCR/측정 템플릿/항목별 의견 저장은 Phase 2+ 후속 작업으로 분리했다.
