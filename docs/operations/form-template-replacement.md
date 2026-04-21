# 양식 템플릿 교체 운영 Runbook

**문서 유형**: 운영 절차서
**작성일**: 2026-04-21
**대상 독자**: 개발자 (1인 운영 체계)
**관련 양식**: UL-QP-18-01 ~ UL-QP-18-11, UL-QP-19-01

---

## 1. 개요

이 runbook은 UL-QP-18/19 시리즈 양식 파일(`.docx`/`.xlsx` 템플릿)을 새 개정본으로 교체할 때
따라야 할 절차를 기술합니다.

### 양식 교체가 필요한 상황

- 절차서 개정으로 양식 서식/항목 변경
- 양식 번호 유지하면서 레이아웃 변경
- 서명란, 결재란 추가/변경

### 양식 교체가 **필요 없는** 상황

- 서비스 코드만 변경 (데이터 매핑 로직 수정)
- 새 양식 번호 추가 (신규 파일 추가이므로 본 runbook 절차 불필요)

---

## 2. 사전 요구사항

```bash
# 필수 도구
node --version   # v22 이상
pnpm --version   # v9 이상
docker compose ps  # postgres + redis 실행 중 확인

# 개발 환경 동기화
git pull
pnpm install
```

---

## 3. 양식 파일 위치 및 관리

### 파일 위치

```
apps/backend/src/modules/reports/form-templates/
├── UL-QP-18-01/
│   └── *.xlsx          ← 시험설비 관리 대장
├── UL-QP-18-02/
│   └── *.docx          ← 시험설비 이력카드
├── UL-QP-18-03/
│   └── *.docx          ← 중간점검표
...
└── UL-QP-19-01/
    └── *.xlsx          ← 연간 교정계획서
```

### SSOT 참조 구조

각 양식은 **3-way 분리 패턴**으로 관리됩니다:

| 파일 유형                  | 역할                                 | 교체 시 수정 필요 여부               |
| -------------------------- | ------------------------------------ | ------------------------------------ |
| `*.layout.ts`              | 셀 좌표, 행 인덱스, 컬럼 인덱스 SSOT | **교체 후 좌표 재측정 시** 수정 필요 |
| `*-export-data.service.ts` | DB 쿼리, 데이터 변환                 | 필드 추가 시 수정                    |
| `*-renderer.service.ts`    | 템플릿 렌더링                        | 일반적으로 수정 불필요               |

---

## 4. 양식 교체 절차

### Step 1: 신규 양식 파일 준비

```bash
# 교체할 양식의 폼 번호 결정 (예: UL-QP-18-06)
FORM_NUMBER="UL-QP-18-06"
FORM_DIR="apps/backend/src/modules/reports/form-templates/${FORM_NUMBER}"

# 기존 파일 백업
cp "${FORM_DIR}/"*.docx "${FORM_DIR}/"*.docx.bak.$(date +%Y%m%d)

# 신규 파일 배치
cp /path/to/new-template.docx "${FORM_DIR}/"
```

### Step 2: 셀 좌표 재검증

양식 레이아웃이 변경된 경우 `*.layout.ts`의 행/열 인덱스를 재측정합니다.

```bash
# DOCX XML 덤프로 셀 구조 확인
node -e "
  const fs = require('fs');
  const PizZip = require('pizzip');
  const buf = fs.readFileSync('${FORM_DIR}/new-template.docx');
  const zip = new PizZip(buf);
  const xml = zip.file('word/document.xml').asText();
  // 테이블 행 수 계산
  const rows = xml.match(/<w:tr[ >]/g);
  console.log('행 수:', rows?.length ?? 0);
"
```

레이아웃 변경이 있으면 해당 양식의 `.layout.ts` 파일에서 `ROWS` 상수를 수정합니다.

### Step 3: 렌더링 검증

```bash
# 단위 테스트 실행 (renderer spec이 있는 경우)
pnpm --filter backend run test -- --testPathPattern="renderer"

# TypeScript 컴파일 검증
npx tsc --noEmit
```

### Step 4: E2E 다운로드 검증

```bash
# 해당 양식의 E2E 테스트 실행
pnpm --filter frontend run test:e2e -- wf-export-ui-download

# 이력카드 특화 (QP-18-02)
pnpm --filter frontend run test:e2e -- wf-history-card-export
```

### Step 5: 수동 육안 검증

```bash
# 개발 서버 시작
pnpm dev

# 브라우저에서 실제 다운로드 후 파일 열어 확인
# - 셀 데이터가 올바른 위치에 주입되는가
# - 서명 이미지가 정상 표시되는가
# - 폰트/레이아웃이 원본 양식과 일치하는가
```

### Step 6: 백업 파일 정리

```bash
# 검증 완료 후 백업 파일 삭제
rm "${FORM_DIR}/"*.bak.*
```

---

## 5. 롤백 절차

교체 후 문제 발생 시:

```bash
# 방법 1: git으로 되돌리기 (미커밋 상태)
git checkout -- apps/backend/src/modules/reports/form-templates/

# 방법 2: 백업 파일로 복구 (커밋 후)
BACKUP_DATE="20260421"  # 백업 생성 날짜
cp "${FORM_DIR}/"*.bak.${BACKUP_DATE} "${FORM_DIR}/template.docx"

# 방법 3: 이전 커밋에서 파일 복구
git show HEAD~1:"${FORM_DIR}/template.docx" > "${FORM_DIR}/template.docx"
```

---

## 6. 양식 번호별 특이사항

| 양식        | 특이사항                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| UL-QP-18-01 | XLSX, 동적 행 수. `setDataRows()` 패턴 사용. 팀명 기반 파일명 생성                                                       |
| UL-QP-18-02 | 이력카드. 장비 사진 EMU 치수 재측정 필요 (`history-card.layout.ts` 주석 참조)                                            |
| UL-QP-18-03 | DOCX, 중간점검. 결재란 3단계 구조                                                                                        |
| UL-QP-18-06 | DOCX. checkout(반출) + rental import(렌탈 반입) 2가지 variant가 같은 템플릿 공유. 레이아웃 변경 시 두 renderer 모두 영향 |
| UL-QP-18-07 | DOCX. `setDataRows()` 패턴. 최대 20행 SSOT(`TABLE.emptyRows`)                                                            |
| UL-QP-18-08 | XLSX, 다중 시트. 시트1(목록) + 시트2~N(케이블별 Path Loss). 시트명 = 관리번호(31자 제한)                                 |
| UL-QP-18-10 | DOCX, Part1(사용) + Part2(반납) 구조. 5행씩 2세트                                                                        |
| UL-QP-19-01 | XLSX. 교정계획서. 별도 `calibration-plans` 모듈                                                                          |

---

## 7. 관련 파일 참조

| 목적                                    | 경로                                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| 양식 카탈로그 (번호/이름/보존연한 SSOT) | `packages/shared-constants/src/form-catalog.ts`                    |
| Dispatcher (양식별 handler 라우팅)      | `apps/backend/src/modules/reports/form-template-export.service.ts` |
| DOCX 유틸리티                           | `apps/backend/src/modules/reports/docx-template.util.ts`           |
| DOCX XML 서명 삽입                      | `apps/backend/src/modules/reports/docx-xml-helper.ts`              |
| Export 스트리밍 결정                    | `docs/references/export-streaming-decision.md`                     |
