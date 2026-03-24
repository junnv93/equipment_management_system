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

---

## 테스트 데이터 주의사항

특정 데이터 ID의 상태, 제약사항, 사용 시 주의점을 기록합니다.

| 데이터 | 주의사항 | 발견일 |
|--------|---------|--------|
| SPECTRUM_ANALYZER_SUW_E | 여러 스위트에서 사용 → 이전 스위트가 checkout 생성 후 cleanup 안 하면 다음 스위트에서 400. beforeAll에서 기존 checkout 취소 필수. | 2026-03-24 |
| SIGNAL_GEN_SUW_E | Suite 02에서 동적 생성 → afterAll에서 cancel 해도 장비 상태 복원 안 될 수 있음. beforeAll에서 resetEquipmentToAvailable 필수. | 2026-03-24 |
| expectedReturnDate | API는 ISO 8601 형식만 허용 (`2026-06-01T00:00:00.000Z`). 단순 날짜 (`2026-06-01`)는 400 validation error 발생. | 2026-03-24 |

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

---

## 앱 버그 이력

E2E 테스트에서 발견된 앱 버그와 해결 상태를 추적합니다.

| 버그 설명 | 관련 파일 | 상태 | 발견일 | 해결일 |
|----------|----------|------|--------|--------|
| quality_manager가 GET /api/checkouts 접근 시 403 반환 | `packages/shared-constants/src/role-permissions.ts` | 미해결 | 2026-03-24 | |
| quality_manager가 GET /api/equipment-imports 접근 시 403 반환 | `packages/shared-constants/src/role-permissions.ts` | 미해결 | 2026-03-24 | |
| LM이 /calibration/register 직접 접근 시 권한 제어 없음 | `CalibrationRegisterContent.tsx` — canCreateCalibration 체크 미흡 | 미해결 | 2026-03-24 | |
| QM에게 교정계획서 "새 계획서 작성" 버튼 표시됨 | `CalibrationPlansContent.tsx` — CREATE_CALIBRATION_PLAN 권한 체크 누락 | 미해결 | 2026-03-24 | |

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
