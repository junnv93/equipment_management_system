# Phase 0 Evaluation: UL-QP-18-09 소프트웨어 유효성 확인 — 베이스라인 측정

## 측정 일시: 2026-04-19

---

## §1 절차서 ↔ DB/DTO/Template 매핑 매트릭스

### 획득/프로세싱 기능 (T4/T5) — 4 vs 3 필드

| 절차서 요구 필드 | DB JSONB item | Template R# | 현황 |
|---|---|---|---|
| 기능 명칭 (name) | `name` ✅ | R0 col1 | 정상 |
| **독립 방법 (means/independentMethod)** | ❌ 없음 | R1 col1 → `criteria` 잘못 렌더 | **누락 + 셀 오매핑** |
| 수락 기준 (acceptanceCriteria) | `criteria` ✅ | R2 col1 → `result` 잘못 렌더 | **셀 오매핑** |
| **첨부 자료 (attachment)** | ❌ 없음 | — | **누락** |
| 결과 (result) — 절차서 외 | `result` ✅ | R2 col1 (잘못 렌더) | UX 유지 결정 |

### 제어 기능 (T6) — 6 vs 3 필드

| 절차서 요구 필드 | DB JSONB item | Template | 현황 |
|---|---|---|---|
| 제어된 장비 기능 (equipmentFunction) | `name` (혼용) ⚠️ | T6 R1 col0 | 필드명 불일치 |
| **예상되는 장비 기능 (expectedFunction)** | ❌ 없음 | — | **누락** |
| **확인되는 장비 기능 (observedFunction)** | ❌ 없음 | — | **누락** |
| **독립 판정 방법 (independentMethod)** | ❌ 없음 | — | **누락** |
| 수락 기준 (acceptanceCriteria) | `criteria` ✅ | T6 R1 col1 | 정상 |
| **첨부 자료 (attachment)** | ❌ 없음 | — | **누락** |

### DB 스키마 레벨 공백

| 공백 | 파일:행 | 상세 |
|---|---|---|
| vendor/self 상호배제 CHECK 없음 | `packages/db/src/schema/software-validations.ts:90-105` | vendor 타입에 JSONB 필드 허용됨 |
| status 불변식 CHECK 없음 | 동일 | submitted 상태에도 `submitted_at` 없어도 통과 |
| version ≥ 1 CHECK 없음 | 동일 | CAS 필드 무결성 미보장 |
| audit_log append-only 트리거 없음 | `apps/backend/drizzle/` | UPDATE/DELETE 가능 |
| test_software.latestValidationId 없음 | `packages/db/src/schema/test-software.ts` | 절차서 §14 quality_approved 연계 없음 |

### 서비스 레이어 공백

| 공백 | 파일:행 | 상세 |
|---|---|---|
| self-approval 가드 없음 | `software-validations.service.ts:358` | approve() 메서드에 `submittedBy === approverId` 체크 없음 |
| dual-same-person qualityApprove 가드 없음 | 동일:404 | `technicalApproverId === approverId` 체크 없음 |
| emitAsync try/catch 없음 | 동일:342/385/432/484 | 리스너 실패 시 DB 성공 트랜잭션도 500 반환 |
| actorName 빈 문자열 | 동일 | `actorName: ''` 하드코딩 |
| findAll 엔드포인트 없음 | `software-validations.controller.ts` | GET / 목록 API 미구현 |

### 프론트엔드 공백

| 공백 | 파일:행 | 상세 |
|---|---|---|
| formNumber 하드코딩 | `ValidationDetailContent.tsx:263` | `formNumber="UL-QP-18-09"` 리터럴 |
| FRONTEND_ROUTES 없음 | `packages/shared-constants/src/frontend-routes.ts` | SOFTWARE_VALIDATIONS 라우트 상수 없음 |
| 글로벌 목록 라우트 없음 | `apps/frontend/app/(dashboard)/` | `/software-validations` 라우트 없음 |
| Sidebar 메뉴 없음 | `components/layout/Sidebar.tsx` | 소프트웨어 유효성 항목 없음 |
| Permission 가드 없음 | ValidationDetailContent | self-approval disabled UX 없음 |
| queryKeys SSOT 없음 | `lib/api/query-config.ts` | softwareValidations queryKeys 미등록 |

---

## §2 베이스라인 수치

| 지표 | 현재 값 | 목표 |
|---|---|---|
| form-template-export.service.ts 라인 수 | **1,485줄** | < 1,280 |
| software-validations spec 케이스 수 | 24개 | 20+ (추가 후) |
| JSONB double-encoding | **10건 전부 string 타입** | array 타입 |
| hardcoded formNumber | 1건 (`ValidationDetailContent.tsx:263`) | 0 |
| self-approval 가드 | **없음** | 구현 |
| test_software 연계 | **없음** | 구현 |

> 참고: p95 latency / bundle delta / axe violations는 서버 실행 환경 필요 — Phase 7 최종 검증 시 측정 예정.

---

## §3 SW_VALID_004 (V-004) 현황

현재 seed V-004 (IECSoft, vendor, quality_approved):
- `vendorName`: "Ametek CTS GmbH" **← P0045 원문과 다름 (Newtons4th Ltd)**
- `softwareVersion`: "2.5a" **← P0045 원문과 다름 (2_6-U)**
- `infoDate`: 2025-12-01 **← P0045 원문과 다름 (2021-09-22)**
- `vendorSummary`: "IECSoft 전도성 방해 시험 SW. 공급자 시연 및 교차 검증 완료." **← 임의 작성**
- `receivedDate`: 2025-12-10 **← P0045 원문과 다름 (2021-09-22)**
- `attachmentNote`: "시연 보고서 + 비교 시험 데이터 첨부" **← 임의 작성**

---

## §4 JSONB 이중 인코딩 버그 재현

```sql
SELECT id, left(acquisition_functions::text, 80) AS raw FROM software_validations
WHERE acquisition_functions IS NOT NULL LIMIT 3;
```

결과:
```
66660007... | "[{\"name\":\"프로브 데이터 수집\",\"criteria\":\"±0.5dB 이내\",\"result\":\"pass\"}..."
```

`jsonb_typeof(acquisition_functions)` = `string` — JSONB 안에 문자열로 감싸진 JSON 배열.
원인: `seed.ts:185,189,193` 에서 `JSON.stringify([...])` 사용 → Drizzle이 다시 JSONB로 직렬화하여 이중 인코딩.

현재 `parseJsonbFunctionArray(raw)` 의 `typeof raw === 'string' ? JSON.parse(raw) : raw` 폴백이 런타임에서 이를 우회하고 있음 → 기능은 작동하지만 데이터 무결성 위반.

---

## §5 셀 매핑 버그 (공백 3)

현재 코드 (`form-template-export.service.ts:728-731`):
```ts
const acq = acqFunctions[0];  // 첫 항목만 렌더
doc.setCellValue(4, 0, 1, acq.name);     // T4 R0 = name ✅
doc.setCellValue(4, 1, 1, acq.criteria); // T4 R1 = criteria ❌ (should be independentMethod)
doc.setCellValue(4, 2, 1, acq.result);   // T4 R2 = result ❌ (should be acceptanceCriteria)
```

주석 (L688): `T4: 획득기능 (3행2열) — R0: Name, R1: Means, R2: Criteria`

→ 주석은 올바른 절차서 매핑을 기술하고 있으나, 코드가 이를 구현하지 않음.
→ `independentMethod` 필드가 DB/seed에 없어 `criteria`로 오채움.

---

## §6 P0045 IECSoft v2.6-U 원문 데이터 추출 결과

원문 docx 경로: `docs/procedure/P0045 시험 소프트웨어의 유효성확인-IECSoft-2_6-U.docx`

| 필드 | P0045 원문 값 |
|---|---|
| validationType | `vendor` (방법 1: 공급자 시연) |
| vendorName | `Newtons4th Ltd` |
| softwareName | `IECSoft` |
| softwareVersion | `2_6-U` |
| infoDate | `2021-09-22` |
| vendorSummary | `최신 standard 대응 (STANDARD ver 표기 및 디버그)` |
| receivedBy | `최형민` (USER_TECHNICAL_MANAGER_SUWON_ID로 매핑 예정) |
| receivedDate | `2021-09-22` |
| attachmentNote | `IECSoft v2.6 업데이트 노트.pdf` |
| status | `quality_approved` |

---

## Phase 0 결론

확인된 공백 6개 모두 코드 실증 완료:
1. **DB 4/6 필드 누락** — `independentMethod`, `attachment`, 제어 기능 4개 필드 없음
2. **제어 기능 스키마 별도** — 6필드가 현재 3필드 스키마(`name/criteria/result`)와 불일치
3. **T4/T5 셀 매핑 버그** — R1=criteria(오), R2=result(오); 주석은 R1=Means, R2=Criteria가 정답
4. **quality_approved → test_software 연계 없음** — 이벤트만 발행, DB 업데이트 없음
5. **재검증 주기 미구현** — softwareVersion 변경 시 알림/nullify 없음
6. **P0045 골든 시드 없음** — V-004는 임의 조작 데이터 (Ametek, v2.5a)

**Phase 1 진입 준비 완료.**
