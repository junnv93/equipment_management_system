# Harness 완료 프롬프트 아카이브 — 양식 Export / DOCX

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## 38차 신규 — QP-18 양식 export 템플릿 매핑 검증 (2건)

> **발견 배경 (2026-04-09, 38차)**: QP-18-02 이력카드 검증 과정에서 XML 마커 불일치(4개 이력 섹션 삽입 실패), DATA_START_ROW 오류(QP-19-01), 날짜 형식/폰트/파일명 등 다수 이슈 발견 및 수정. 동일 패턴의 잠재적 이슈가 QP-18-03(중간점검표), QP-18-05(자체점검표)에도 존재할 수 있음. 양식 템플릿 파일을 기준으로 코드 매핑의 정확성을 검증하는 프롬프트.

### ~~🟡 MEDIUM — QP-18-03 중간점검표 DOCX 템플릿 ↔ 코드 매핑 검증~~ ✅ 완료 (2026-04-10 39차)

> 검증: 9개 실제 완성 문서(E0001~E0350)와 대조. wf-19c E2E 테스트 9/9 통과. DocxTemplate에 appendParagraph/appendTable/appendImage/appendRichTable 추가. renderResultSections로 동적 콘텐츠 Export 지원. 프론트엔드 ResultSectionsPanel UI 구현.

### ~~원문 (참고용)~~

```
QP-18-02 이력카드 검증에서 발견된 패턴:
- XML 텍스트 마커가 태그로 분리되어 검색 실패 (silent)
- DocxTemplate.setDataRows가 기존 빈 행을 복제 vs 새 행 삽입 차이로 서식 깨짐
- 날짜 형식/폰트가 양식 원본과 불일치

QP-18-03 중간점검표 동일 검증 필요:
1. v1.docx 템플릿 파일을 node로 파싱하여 실제 테이블/셀/텍스트 구조 확인
2. form-template-export.service.ts의 exportIntermediateInspection (line 316~500)의
   setCellValue/setDataRows 호출이 템플릿 셀 위치와 정확히 일치하는지 대조
3. 시드 데이터로 실제 export 실행 → DOCX 파싱 → 모든 필드 값이 올바른 위치에 있는지 검증
4. 날짜 형식, 폰트, 판정 라벨(합격/불합격), 서명 이미지 삽입 정상 동작 확인

작업:
- 템플릿 구조 파악 (node PizZip으로 XML 분석)
- 코드 매핑 대조표 작성
- 불일치 발견 시 수정 (양식이 기준, 코드를 양식에 맞춤)
- Playwright E2E 테스트: 장비상세 → 중간점검 탭 → 내보내기 → DOCX 내용 검증

검증:
- pnpm tsc --noEmit exit 0
- Backend E2E: DOCX 파싱 기반 필드별 검증
- Playwright E2E: 브라우저 다운로드 + DOCX 내용 검증
```

### ~~🟡 MEDIUM — QP-18-05 자체점검표 DOCX 템플릿 ↔ 코드 매핑 검증~~ ✅ 완료 (2026-04-10 39차)

> 검증: QP-18-03과 동일하게 E2E 테스트 + 실제 문서 대조 완료. 자체점검 결과 섹션 CRUD, Export 동적 렌더링, SelfInspectionTab 통합 모두 정상.

### ~~원문 (참고용)~~

```
QP-18-05 자체점검표 검증 (QP-18-03과 동일 패턴):
1. v1.docx 템플릿 파일 구조 확인 (3개 테이블: 장비정보+점검항목, 특기사항, 결재)
2. form-template-export.service.ts의 exportSelfInspection (line 506~701)의
   setCellValue/setDataRows 호출이 템플릿과 일치하는지 대조
3. 특히 주의:
   - 동적 점검항목 vs 레거시 fallback (4항목) 분기가 정상 동작하는지
   - specialNotes JSONB 파싱이 다양한 데이터 shape에서 안전한지
   - 비교정기기일 때 교정유효기간이 'N/A'로 정확히 표시되는지
4. 시드 데이터로 실제 export → DOCX 내용 검증

작업:
- 템플릿 구조 파악
- 코드 매핑 대조
- 불일치 수정 (양식 기준)
- E2E 테스트 작성

검증:
- pnpm tsc --noEmit exit 0
- Backend E2E + Playwright E2E 통과
```

---

## 36차 신규 — generate-prompts 3-agent 병렬 스캔 (10건)

> **발견 배경 (2026-04-08, 36차)**: aria-label SSOT 롤아웃(35차) 완료 후 example-prompts.md 상단 우선순위가 모두 stale로 확인되어 generate-prompts 스킬 실행. Backend/Frontend/Infra+Packages 3개 에이전트 병렬 스캔 + 2차 verify(Read/Grep) 통과한 항목만 등재. **#10 (Reports/Alerts URL SSOT) 의 Alerts 부분은 커밋 95534053 에서 별도 처리됨 — Reports 부분만 잔존.**

### ~~🟡 MEDIUM — Frontend Dockerfile build stage root 실행 + pnpm 중복 install~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: USER node / deps 스테이지 통합 / HEALTHCHECK `/api/health` + `wget` / tini ENTRYPOINT 양쪽 Dockerfile 모두 이미 적용. `docker build --target production -t ems-frontend:verify .` 성공, 컨테이너 내 `id = uid=1000(node)` 확인. 37차 루트 수정(scripts COPY + `--ignore-scripts`) 까지 포함. 아카이브로 이동.

### ~~🟡 MEDIUM — Backend Dockerfile layer caching 깨짐 (lockfile-only 레이어 무효화)~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: backend/frontend 모두 lockfile-only 레이어 + 별도 prod-deps 스테이지(alpine) 이미 적용. 2차 빌드 캐시 hit: backend 30 / frontend 14 단계 전부 CACHED (≤3s). 아카이브로 이동.

---

## 33차 신규 — review-architecture 후속 이슈 (3건)

### ~~🟢 LOW — global-setup 에러 로그 정밀화~~ ✅ STALE (2026-04-09 38차 세션)

> 검증: `global-setup.ts:93-115` seed try/catch 와 `:121-152` trigger-overdue try/catch 가 이미 분리되어 있고, 각각 `"❌ 시드 데이터 로딩/검증 실패"` / `"❌ 교정 기한 초과 트리거 실패"` prefix + 수동 재현 명령(`pnpm ... seed-test-new.ts` / `curl -X POST ...`)을 출력한다. 주석(L90-91, L117-119)도 의도 설명 완료. 프롬프트 작성 시점 이후 이미 반영됨.

---

## 31차 신규 — Export spec API-only 갭 + WF-21 후속 (4건)

> **갭 발견 배경 (2026-04-08, 31차)**: WF-21 cable path loss spec을 wf-19b/wf-20b 패턴 답습해 작성한 결과 API-only로 정착. 사용자 피드백: "테스트 후 어떤 UI가 검증되었는지 항상 설명해라"
> → 스캔 결과 wf-19b/wf-20b/wf-21 3개 export spec 모두 사용자가 누르는 "내보내기" 버튼 동선이 0건 검증된 상태. 패턴화된 회귀 위험.
> 또한 WF-21 자체의 케이블 등록 다이얼로그/측정 폼 다이얼로그도 미검증 (기존 spec은 백엔드 API만 호출).

### ~~🟡 MEDIUM — Export 다운로드 UX 검증 spec (wf-19b/20b/21 공통 갭)~~ ✅ STALE (2026-04-12 45차 세션)

> 검증: `wf-export-ui-download.spec.ts` — 8개 양식(QP-18-01/03/05/06/07/08/09/10) 브라우저 다운로드 UX 검증 완료. `expectFileDownload` SSOT 헬퍼(`download-helpers.ts`)로 통합. waitForEvent('download') + filename pattern + RFC 5987 인코딩 검증 포함. API 회귀 테스트(wf-19b/20b/21)도 병행 유지.

### ~~🟡 MEDIUM — Export spec UI 갭 패턴 가드 (verify-* 스킬 보강)~~ ✅ 해결 (2026-04-09 38차 세션)

> 선택지 A 채택: `verify-e2e` Step 5b 에 allow-list 마커(`// @api-only: <사유>`) 룰 추가. 기존 35차 grep 가드에 marker 필터 단계 추가 + 2026-04-09 부분 해결 현황(wf-export-ui-download.spec.ts + expectFileDownload SSOT helper) 과 미커버 양식(QP-18-03/05/06/10 backend-only, QP-18-09 validation fixture) 명시. 의도된 API-only spec 은 마커로 명시적 opt-out, 미커버 양식은 silent drop 방지.

<details><summary>원문 (참고용)</summary>

```
배경: 31차에서 wf-19b/20b/21 3개 export spec이 모두 API-only로 정착한 패턴이 발견됨.
앞으로 추가될 export spec (UL-QP-18-04/06/07/09/11 등 미작성 양식)도 동일 함정에 빠질
위험. verify-e2e 또는 verify-workflows 스킬에 가드 추가 필요.

작업:
1. .claude/skills/verify-e2e/SKILL.md (또는 verify-workflows) 에 새 체크 추가:
   - "export 키워드 + page.request.get 만 사용하는 spec은 동일 양식의 UI 다운로드 spec
     동행 여부 확인" 룰
   - grep 패턴: spec 파일 내 'export/form/UL-QP-18' 등장 + 'waitForEvent("download")' 부재
     → WARN
2. 또는 manage-skills 워크플로로 신규 verify-export-ui-coverage 스킬 생성
3. tech-debt-tracker.md에 "Export UI 다운로드 동선 미검증 양식" 누적 트래킹 항목 추가

검증:
- /verify-e2e (또는 신규 스킬) 실행 시 wf-19b/20b/21 3건이 WARN으로 보고됨
- 위 'WF-21 UI 동선 검증 spec'과 'Export 다운로드 UX 검증 spec' 추가 후 WARN 0건
- 메타 변경이므로 tsc/test 영향 없음

선택: 단순 docs/development/E2E_PATTERNS.md 에 "export spec은 API + UI 다운로드 한 쌍으로
작성" 가이드라인 명시만 해도 가능 (스킬 보강 vs 문서화 — 사용자 결정 필요)
```

</details>

---
