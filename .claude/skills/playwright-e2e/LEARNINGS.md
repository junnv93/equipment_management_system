# Playwright E2E 스킬 경험 기록

이 파일은 스킬이 실행될 때마다 자동으로 업데이트됩니다.
각 섹션에 경험을 축적하여 다음 실행 시 같은 실수를 반복하지 않습니다.

---

## 로케이터 패턴

검증된 로케이터와 실패한 로케이터를 기록합니다.

| 페이지/컴포넌트 | 실패한 로케이터 | 올바른 로케이터 | 이유 |
|----------------|---------------|---------------|------|
| /checkouts/create | `getByRole('heading', { name: /반출 신청\|반출 생성/i })` | `getByRole('heading', { name: '장비 반출 신청', level: 1 })` | "반출 신청 안내" h5도 매칭 → strict mode violation |
| 반출 상세 페이지 | `page.waitForLoadState('networkidle')` | `expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible()` | Next.js HMR이 networkidle을 영원히 차단 |
| /calibration 등록 버튼 | `getByRole('link', { name: '교정 정보 등록' })` | `getByText('교정 정보 등록').first()` | "+" 접두사 포함 가능, link/button 역할 불확실 |
| /calibration/register 제목 | `getByRole('heading', { name: /교정.*등록/ })` | `getByText('교정 정보 등록').first()` | heading 레벨 불일치 |
| /calibration-plans KPI 카드 | `getByText('작성 중')` 개별 검증 | `getByText(/작성 중\|확인 대기/).count()` 일괄 검증 | KPI 카드 렌더링이 비동기, 개별 검증 시 타이밍 문제 |
| /calibration-plans/create 폼 | `getByRole('combobox').filter({ hasText: /시험소/ })` | `getByText(/시험소/).first()` | shadcn/ui Select는 combobox 역할이 아닐 수 있음 |
| 보정계수 DELETE API | `request.delete(url, { data: { version } })` | `request.delete(url + '?version=N')` | DELETE 엔드포인트는 @Query('version') 사용 (body 아님) |
| 보정계수 반려 API | `{ approverComment: reason }` | `{ rejectionReason: reason }` | reject DTO는 rejectionReason 필드 사용 |
| 승인 반려 버튼 (데스크탑) | `getByRole('button', { name: '반려' }).first()` | 상세 모달 경유: `[data-testid="approval-item"]` 내 상세 버튼 → dialog 반려 | 데스크탑 sr-only + 모바일 lg:hidden + BulkActionBar = 3개 매칭 |
| 승인 전체 선택 체크박스 | `getByLabel(/전체 선택/)` | `locator('#select-all').click({ force: true })` | 선택 후 aria-label이 "전체 해제"로 변경 → 로케이터 실패 |
| 반려 검증 에러 "10자 이상" | `getByText(/10자 이상/)` | `getByRole('alert')` | label "반려 사유 (10자 이상 필수)"와 alert 둘 다 매칭 |
| 상세 모달 "요청 상세" | `getByText('요청 상세')` | `getByRole('heading', { name: '요청 상세', exact: true })` | heading "승인 요청 상세"와 h4 "요청 상세" 둘 다 매칭 |
| 벌크 코멘트 "검토 코멘트" | `getByText('검토 코멘트')` | `getByLabel('검토 코멘트')` | heading과 label 둘 다 매칭 |
| 소프트웨어 벌크 승인 | Dialog 직접 기대 | AlertDialog(확인) → Dialog(코멘트) 2단계 | BulkActionBar → AlertDialog, 확인 후 ApprovalsClient → commentRequired Dialog |
| /non-conformances 상세 "등록" | `getByText('등록')` | `getByText('등록', { exact: true })` | "등록됨", "수리 이력 등록", "등록일" 등과 중복 매칭 |
| /non-conformances 상세 "발견일" | `getByText('발견일')` | `getByText('발견일').first()` | 헤더 메타 + 정보 카드에 중복 존재 |
| /non-conformances 상세 "오작동" | `getByText('오작동')` | `getByText('오작동').first()` | 타입 칩 + 전제조건 안내 + 제목에 중복 |
| /non-conformances KPI 카드 | `filter({ hasText: '처리 중' })` | `filter({ hasText: '조치 완료' }).first()` | TM 스코프에서 open 카운트 0이면 "처리 중" 카드 텍스트가 안 보일 수 있음 |
| /non-conformances Select | `filter({ hasText: /전체 상태/ })` | `comboboxes.nth(0)` | shadcn Select에서 hasText 필터는 불안정. nth()가 더 안정적 |
| /non-conformances 사이트 필터 URL | `site=SUW` | `site=suwon` | 실제 URL 파라미터는 소문자 (suwon, uiwang 등) |
| 대시보드 OverdueCheckoutsCard 탭 | `getByRole('button', { name: '기한 초과' })` | `getByRole('tab', { name: /기한 초과/ })` | role="tab"이며 텍스트에 "(N)" 건수 포함 → 정규식 매칭 필수 |
| 대시보드 AlertBanner | `banner.locator('[role="status"]')` | `page.locator('[role="status"][aria-label="긴급 조치 요약"]')` | AlertBanner 자체가 role="status" or role="alert" — 자식이 아닌 자기 자신에 role 부여 |
| 대시보드 MiniCalendar 요일 | `calendar.getByText('일')` | `calendar.getByText('월', { exact: true }).first()` | "일"은 날짜(1일, 11일 등)에도 포함 → strict mode violation. "월"/"토" 등으로 우회 |
| 대시보드 RecentActivities 탭 | `getByRole('button', { name: '전체' })` | `getByRole('tab', { name: '전체' })` | shadcn Tabs → TabsTrigger는 role="tab" (button 아님) |
| 대시보드 RecentActivities section | `section[aria-label="최근 활동"]` | `[role="region"][aria-labelledby="recent-activities-title"]` | DashboardClient에서 section aria-label 설정, Card에서 region+aria-labelledby 설정 — 두 층 구조 |
| 장비 상세 폐기 배너 | `getByText('폐기 대기')` 상태 배지 | `getByRole('button', { name: /탭으로 이동/ })` 로드 대기 후 폐기 텍스트 확인 | 상태 배지 텍스트가 다를 수 있음. KPI 스트립 버튼으로 로드 대기가 안정적 |
| 수리 이력 다이얼로그 필드 | `dialog.getByText('수리 결과')` 스크롤 필요 | `dialog.locator('input[type="date"]')` + `dialog.locator('textarea')` | max-h-[90vh] overflow-y-auto 다이얼로그에서 하단 필드는 스크롤 없이 안 보일 수 있음 |
| 장비 목록 빈 상태 대기 | `#filter-site` 셀렉터 대기 | 빈 상태 메시지 직접 대기 (`getByText(/검색 결과가 없습니다/)`) | 검색 결과 없는 경우 필터 UI가 렌더링되지 않아 #filter-site 없음 |
| 사고 이력 유형 선택 (셀렉트) | `dialog.getByRole('combobox').first()` 후 `.click()` | `dialog.locator('button[role="combobox"]').first()` | shadcn Select 트리거는 button[role="combobox"] |
| SA 빈 검색 테스트 | `siteAdminPage` (LM) 사용 | `systemAdminPage` (SA) 사용 | LM도 site= 기본 리다이렉트가 있어 ?site=&teamId= 우회 안 됨. SA는 리다이렉트 없음 |
| AttachmentSection "장비 사진" | `getByText('장비 사진')` | `getByRole('heading', { name: '장비 사진', level: 4 })` | h4 + label 2개 매칭 → strict mode. heading role로 한정 |
| AttachmentSection "검수보고서" | `getByText(/검수보고서/)` | `getByRole('heading', { name: /검수보고서/, level: 4 })` | h4, label, paragraph 4곳 매칭 → strict mode |
| 교정 결과 선택 "적합" | `getByRole('option', { name: '적합' })` | `getByRole('option', { name: '적합', exact: true })` | "부적합", "조건부 적합"도 매칭. exact: true 필수 |
| 첨부파일 탭 콘텐츠 | `tab.click()` 후 즉시 체크 | `goto('?tab=attachments')` + `emptyState.or(table)` 대기 | URL push 기반 탭 → tabpanel 콘텐츠 비동기 로딩. 직접 URL 접근이 안정적 |

---

## 테스트 데이터 주의사항

특정 데이터 ID의 상태, 제약사항, 사용 시 주의점을 기록합니다.

| 데이터 | 주의사항 | 발견일 |
|--------|---------|--------|
| SPECTRUM_ANALYZER_SUW_E | 여러 스위트에서 사용 → 이전 스위트가 checkout 생성 후 cleanup 안 하면 다음 스위트에서 400. beforeAll에서 기존 checkout 취소 필수. | 2026-03-24 |
| NC_003 (damage, open) | MEASUREMENT_STAND_SUW_S 장비 — SAR 팀 소속. TM(FCC EMC/RF)이 접근 불가. NC_001(malfunction, FCC팀)을 대신 사용. | 2026-03-24 |
| NC_004 (closed) | BCI_SUW_A 장비 — Automotive EMC 팀 소속. TM(FCC EMC/RF)이 접근 불가. NC_005(closed, FCC팀)를 대신 사용. | 2026-03-24 |
| NC_006 (corrected, with repair) | HARNESS_COUPLER_SUW_A — Automotive EMC 팀 소속. TM 접근 불가. NC_008(corrected, FCC팀)을 대신 사용. | 2026-03-24 |
| BCI_SYSTEM (eeee4004) | non_conforming 상태이지만 Automotive EMC 팀 소속. TE/TM(FCC팀)이 접근 불가. NC 중복 생성 테스트에 사용 불가. | 2026-03-24 |
| HARNESS_COUPLER_SUW_A | Automotive EMC 팀 소속. TE(수원 FCC)의 장비 목록에 표시되지만 NC 생성 시 권한 에러 발생 가능. | 2026-03-24 |
| SIGNAL_GEN_SUW_E | Suite 02에서 동적 생성 → afterAll에서 cancel 해도 장비 상태 복원 안 될 수 있음. beforeAll에서 resetEquipmentToAvailable 필수. | 2026-03-24 |
| expectedReturnDate | API는 ISO 8601 형식만 허용 (`2026-06-01T00:00:00.000Z`). 단순 날짜 (`2026-06-01`)는 400 validation error 발생. | 2026-03-24 |
| DISPOSAL_WORKFLOW_B1 | 전체 워크플로우 테스트용 장비. beforeAll에서 resetDisposalAndEquipment 필수. afterAll에서도 정리 필요. | 2026-03-24 |
| Disposal review API 응답 | 일부 경우 resp.ok()이지만 빈 JSON body 반환. resp.json() 대신 resp.text()로 파싱 후 조건부 JSON.parse 필요. | 2026-03-24 |
| calibration_plans 스키마 | submitted_by 컬럼 없음 (submitted_at만 존재). DB 리셋 SQL에서 submitted_by 참조 시 에러 발생. | 2026-03-24 |
| disposal_requests UUID LIKE | `id NOT LIKE 'dddd%'` → `id::text NOT LIKE 'dddd%'` 캐스팅 필수. UUID 타입에 LIKE 연산자 사용 불가. | 2026-03-24 |
| 장비 등록 위자드 구조 | 4단계 위자드 (기본→상태·위치→교정→이력·첨부). 파일 첨부는 Step3(인덱스). 수정 모드는 3단계(Step2에 첨부 합체). 각 스텝 필수 필드: Step0만 name/site/teamId. | 2026-03-26 |
| 교정 등록 성적서번호 | certificateNumber는 교정이력 테이블 컬럼에 표시되지 않음. 기관명과 "성적서 다운로드" 버튼으로 검증. | 2026-03-26 |

---

## 에이전트 행동 패턴

generator/healer 에이전트의 반복적인 실수나 유용한 행동을 기록합니다.

| 에이전트 | 관찰된 행동 | 대응 방법 | 발견일 |
|---------|-----------|----------|--------|
| *(아직 기록 없음)* | | | |

---

## 타이밍/안정성 패턴

특정 페이지나 동작에서 필요한 대기 전략을 기록합니다.

| 페이지/동작 | 필요한 대기 전략 | 이유 | 발견일 |
|------------|----------------|------|--------|
| 모든 페이지 | `waitForLoadState('networkidle')` 사용 금지 | Next.js dev 서버의 HMR WebSocket이 idle을 방해 → 2분 타임아웃 | 2026-03-24 |
| API 호출 | `getBackendToken()` 토큰 캐싱 필수 | test-login 엔드포인트 rate limit (100/분). 캐시 없으면 병렬 실행 시 429 | 2026-03-24 |
| Serial 스위트 | `clearBackendCache()` 매 단계 호출 | 백엔드 인메모리 캐시가 이전 상태를 반환하여 CAS version 불일치 발생 | 2026-03-24 |
| 승인 목록 로딩 | `.isVisible()` 즉시 반환 금지 → `waitForListOrEmpty()` 사용 | TanStack Query 데이터 로딩 전 `.isVisible()` = false. `emptyState.or(approvalList)` 대기 후 분기 필요 | 2026-03-24 |

---

## 앱 버그 이력

E2E 테스트에서 발견된 앱 버그와 해결 상태를 추적합니다.

| 버그 설명 | 관련 파일 | 상태 | 발견일 | 해결일 |
|----------|----------|------|--------|--------|
| quality_manager가 GET /api/checkouts 접근 시 403 반환 | `packages/shared-constants/src/role-permissions.ts` | 미해결 | 2026-03-24 | |
| quality_manager가 GET /api/equipment-imports 접근 시 403 반환 | `packages/shared-constants/src/role-permissions.ts` | 미해결 | 2026-03-24 | |
| LM이 /calibration/register 직접 접근 시 권한 제어 없음 | `CalibrationRegisterContent.tsx` — canCreateCalibration 체크 미흡 | 미해결 | 2026-03-24 | |
| QM에게 교정계획서 "새 계획서 작성" 버튼 표시됨 | `CalibrationPlansContent.tsx` — CREATE_CALIBRATION_PLAN 권한 체크 누락 | 미해결 | 2026-03-24 | |
| QM에게 장비 상세 "수정" 버튼 표시됨 | `EquipmentStickyHeader.tsx` — UPDATE_EQUIPMENT 권한 체크가 QM을 제외하지 않음 | 미해결 | 2026-03-24 | |
| QM에게 장비 상세 "반출 신청" 버튼 표시됨 | `EquipmentStickyHeader.tsx` — CREATE_CHECKOUT 권한 체크가 QM을 제외하지 않음 | 미해결 | 2026-03-24 | |
| spare 장비에 D-day 배지 표시됨 | `EquipmentStickyHeader.tsx` — spare 상태에서 D-day 배지 숨김 로직 미적용 | 미해결 | 2026-03-24 | |

---

## 스킬 개선 이력

SKILL.md에 반영된 규칙 변경 사항을 기록합니다.

| 변경 내용 | 근거 (어떤 경험에서 나왔는지) | 날짜 |
|----------|--------------------------|------|
| Phase 5 결과 보고서 추가 | 테스트 실행 후 종합 결과가 필요하다는 사용자 피드백 | 2026-03-24 |
| Phase 6 자기 개선 추가 | 스킬이 경험을 축적하여 자기 발전해야 한다는 사용자 요청 | 2026-03-24 |
| networkidle 금지 규칙 실증 | Suite 01에서 5/8 실패 → domcontentloaded + 요소 대기로 전환 후 8/8 통과 | 2026-03-24 |
| 토큰 캐싱 필수 규칙 | rate limit 429로 QM/TE 역할 테스트 전체 실패 → 캐싱 추가 후 해결 | 2026-03-24 |
| ISO 8601 날짜 형식 규칙 | S14에서 단순 날짜 형식으로 400 validation error → ISO 형식으로 통일 | 2026-03-24 |
