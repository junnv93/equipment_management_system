# 다음 세션 핸드오프 — 2026-04-17 UL-QP-18 양식 3종 교체 + 3-way 분리 세션 종료

> 이전 `2026-04-17-next-session-handoff.md`는 다른 세션 산출물이므로 건드리지 않음.
> 이 파일은 UL-QP-18 양식 관리 도메인 세션 전용.

## 이번 세션 요약 (한 줄)

UL-QP-18-01/03/05 3개 양식을 새 버전으로 교체, 자체점검 DB에 classification/calibrationValidityPeriod snapshot 컬럼 추가, form-template-export.service.ts 2168→1429줄로 3-way 분리(Layout/Data/Renderer) 리팩토링 완료. SSOT 라벨 6종 추가, 하드코딩 0건 달성, 767 tests PASS.

## 커밋 목록 (이번 세션, 시간 역순)

```
8f6742fc chore(skills): verify-ssot QP18_LABELS 탐지 + tech-debt 5종 등록
5b50f4dc fix(intermediate-inspections): 팀 조회를 teamId 직접 JOIN으로 교정
55ff0608 feat(forms): ul-qp-18-05 snapshot dto + seed + xlsx-helper spec + 문서
d3350967 refactor(forms): ul-qp-18-01/03/05 3-way 분리 (layout/data/renderer)
a2df6a33 (통합) feat(non-conformances): nc 사진 첨부 UI + qr phase 1-3 e2e 3종
          └─ 이 커밋에 Phase 1/2/4/5/6 (DB snapshot + SSOT labels + 양식 교체
             + 인라인 치환)이 병렬 세션 작업과 함께 묶여 통합됨
3dce1d3b refactor(i18n): audit.fieldLabels SSOT 확장 + approvals 중복 제거
```

## 완료된 Phase (계획 대비)

| Phase | 완료 | 산출물 |
|---|---|---|
| 0 사전 정리 | ✅ | audit i18n SSOT 통합, 양식 파싱, DB 스키마 매핑 |
| 1 DB 마이그레이션 | ✅ | drizzle 0031 — self-inspection snapshot 2 컬럼 |
| 2 SSOT Layout 상수 | ✅ | labels.ts 6종 + layout.ts 3개 (신규) |
| 3 Data/Renderer 분리 | ✅ | 서비스 6개 + xlsx-helper + docx-xml-helper 확장 |
| 4 Workflow 매핑 | ✅ | snapshot record 우선 + 마스터 fallback |
| 5 Equipment Registry SSOT | ✅ | 하드코딩 0건, schemas 라벨만 사용 |
| 6 양식 파일 교체 | ✅ | 3종 교체 + 긴 파일명(운영 변종) 삭제 |
| 7 seed/테스트 | ✅ 부분 | seed 2종 + xlsx-helper unit 7건 (e2e는 tech-debt) |
| 8 문서 | ✅ | report-export-mapping / forms-index / backend-patterns 3종 |

## 검증 상태 (세션 종료 시점)

- `pnpm tsc --noEmit` — **exit 0**
- `pnpm --filter backend run build` — **PASS**
- `pnpm --filter backend run test` — **767 tests PASS, 회귀 0건**
- `pnpm --filter backend run db:reset` — **성공, 36/36 verification PASS**
- `form-template-export.service.ts` — **1429줄** (2168→, -34%)
- 하드코딩 grep (교정기기/합격/O/X/setDataRows 매직넘버 등) — **0건**
- verify-ssot / verify-cas / verify-auth / verify-hardcoding / verify-security /
  verify-sql-safety / verify-zod / verify-cache-events — **전부 PASS**
- 자체점검 snapshot 실측: `classification='calibrated'`, `calibrationValidityPeriod='1년'` 확인

## 핵심 아키텍처 결정 (다음 세션이 알아야 할)

1. **snapshot 패턴 확산 원칙**: "양식 헤더로 출력되는 값"에만 snapshot 적용. disposal_requests 장비 스냅샷, checkouts 장비 정보 등 후보가 있으나 스키마 팽창 위험이므로 신중 검토.
2. **3-way 분리**: Layout(상수) / Data(DB) / Renderer(주입) 경계 엄격. db 주입은 Renderer에도 허용(이미지 로드 불가피), 단 review-W2 tech-debt로 감시 대상.
3. **xlsx-helper 범위**: 워크북 "내부 조작"만 추상화. 워크북 생성(`new ExcelJS.Workbook()`)은 설계 의도적 helper 외부.
4. **SSOT 라벨 위치**: `packages/schemas/src/enums/labels.ts` (서버 전용). 프론트 UI는 i18n 메시지 경유.

## 발견된 실제 버그 (해결 완료)

- **W1 `intermediate-inspection-export-data.service.ts:152`**: 팀 조회 시 `managementNumber`로 역조회 (중복 가능한 필드) → `teamId` 직접 JOIN으로 교정 (`5b50f4dc`, 29 tests PASS)

## 다음 세션 권장 작업 (우선순위순)

### 🟠 HIGH — 사용자 가치 즉시 전달

1. **Self-inspection UI에 classification/calibrationValidityPeriod 입력 필드 노출**
   - 서비스는 DTO 수용하나 UI에서 값 전달 없음 → 장비 마스터 derivation fallback만 발생
   - 조치 후: 진짜 snapshot 저장 활성화, drift 방지 효과 극대화
   - 참고: `docs/procedure/template/UL-QP-18-05(01) 자체점검표.docx` 헤더 T0 R0 C1("분류") / T0 R3 C3("교정유효기간")

2. **wf-21-equipment-registry-export.spec.ts 신규 E2E**
   - 검증: `GET /api/reports/export/form/UL-QP-18-01` → xlsx 응답
     - Row 3 D열 = '외부 교정' (MANAGEMENT_METHOD_LABELS)
     - P열 ∈ {사용/고장/여분} (EQUIPMENT_AVAILABILITY_LABELS)
     - O열 ∈ {O/X} (INTERMEDIATE_CHECK_YESNO_LABELS)
     - showRetired=true → '불용' 포함
   - 참고: 기존 wf-19b/wf-20b 패턴 그대로

3. **wf-19b/wf-20b 확장** — 기존 spec에 SSOT 라벨 회귀 케이스 추가 (간단)
   - wf-19b: docx 열어 T0 R5 C4 '합격' 라벨 확인
   - wf-20b: docx 열어 T0 R3 C3 '1년'(snapshot 값) 확인

### 🟡 MEDIUM — 아키텍처 성숙도

4. **review-W3 scope 강제 비대칭 통일**
   - `intermediate-inspection-export-data.service.ts`를 자체점검과 동일한 WHERE 방식으로 변경
   - 현재 post-filter → `eq(equipment.site, filter.site)` WHERE 추가
   - 불필요 DB 쿼리 비용 제거 + drift 위험 제거

5. **review-W2 renderer db 주입 경계 재설계**
   - `renderResultSections`에 필요한 결과 섹션 데이터를 Data Service가 미리 조회 → ExportData에 포함
   - Renderer가 순수 주입(db 접근 0)이 되어 유닛 테스트 복잡도 감소
   - 3개 양식(self/intermediate/history-card) 모두 영향 — Phase 3 패턴 재평가 대상

6. **seed-test-new.ts Phase 0 truncate 리스트 보강** (verify-seed-integrity SHOULD FAIL)
   - `'self_inspection_items'`, `'equipment_self_inspections'`, `'intermediate_inspection_items'`, `'intermediate_inspections'` 4종 FK 역순 추가
   - `verification.ts`에 inspection count 검증 4건 추가

### 🟢 LOW — 장기

7. **renderer 유닛 테스트 3종** — 각 renderer 서비스의 주입 메서드 in-memory 픽스처 기반 테스트
8. **review-W4 EXPORT_QUERY_LIMITS 스트리밍** — 5,000+ 행 상황 대비 `addRow` stream 전환
9. **양식 교체 운영 runbook** — `docs/operations/form-template-replace.md` 작성

## 주의 사항 (다음 세션 함정 예방)

1. **자체점검 DTO 확장 완료**: `classification`, `calibrationValidityPeriod` 2 필드가 optional로 들어감. UI 확장 시 이 필드명 그대로 사용 (variable naming 추측 금지)
2. **양식 파일은 이미 교체됨**: `docs/procedure/template/UL-QP-18-01(02) 시험설비 관리대장.xlsx`가 38KB 순수 템플릿. 긴 파일명(70KB 운영 변종)은 삭제 완료. 추가 교체 불필요
3. **Layout 상수는 backend-local**: 프론트에서 `intermediate-inspection.layout.ts` 등 참조 금지 — 프론트는 i18n 메시지 경유
4. **병렬 세션 드리프트 가능**: 세션 시작 시 `git log --oneline -20`으로 다른 세션 커밋 선행 여부 확인. `git add <specific files>`로 내 작업만 격리 커밋 권장

## 레퍼런스 파일 맵 (빠른 탐색)

```
# 양식 관리 도메인 중심
apps/backend/src/modules/reports/form-template-export.service.ts  (1429줄 dispatcher)
apps/backend/src/modules/reports/form-template.controller.ts       (Template Registry API)
apps/backend/src/modules/reports/form-template.service.ts          (seedFromFilesystem + Replace)
apps/backend/src/modules/reports/docx-xml-helper.ts                (DOCX 공용 유틸)
apps/backend/src/modules/reports/xlsx-helper.ts                    (XLSX 공용 유틸 — 신규)

# 3개 양식별 3-way 분리
apps/backend/src/modules/reports/layouts/equipment-registry.layout.ts
apps/backend/src/modules/reports/services/equipment-registry-{data,renderer}.service.ts
apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection.{layout,export-data,renderer}.ts
apps/backend/src/modules/self-inspections/services/self-inspection.{layout,export-data,renderer}.ts

# SSOT 라벨
packages/schemas/src/enums/labels.ts  (6종 신규: QP18_CLASSIFICATION_LABELS 등)

# DB
packages/db/src/schema/equipment-self-inspections.ts  (snapshot 2 컬럼 추가)
apps/backend/drizzle/0031_add_self_inspection_snapshot.sql

# Seed
apps/backend/src/database/seed-data/operations/{self,intermediate}-inspections.seed.ts
apps/backend/src/database/utils/uuid-constants.ts  (9개 신규 inspection UUID)

# 문서
docs/manual/forms-index.md
docs/manual/report-export-mapping.md
docs/references/backend-patterns.md  (XLSX 3-way 섹션 신설)

# 스킬 확장
.claude/skills/verify-ssot/references/ssot-checks.md  (QP18_LABELS 탐지 grep)
.claude/exec-plans/tech-debt-tracker.md              (이번 세션 후속 6종 등록)
```

## 한 줄 다음 세션 시작 프롬프트 예시

```
이전 세션에서 UL-QP-18 양식 3종 교체 + 3-way 분리 완료.
.claude/exec-plans/active/2026-04-17-next-session-handoff-ul-qp-18-forms.md 읽고
HIGH 우선순위 3종 (self-inspection UI 필드 노출, wf-21 e2e, wf-19b/20b 확장) 중
하나 선택해서 진행.
```
