# 역할별 권한 통합 (System-Wide) E2E 테스트 계획

## 개요

4개 역할(TE/TM/QM/LM)에 대한 전체 시스템 권한을 통합 검증하는 E2E 테스트

## 테스트 파일 구조

### 1. sidebar-visibility.spec.ts — 네비게이션 사이드바 가시성

- TC-01: test_engineer — 교정계획서/승인/감사로그 숨김
- TC-02: technical_manager — 모든 메뉴 표시 + 승인 배지
- TC-03: quality_manager — 모든 메뉴 표시 + 승인 배지
- TC-04: lab_manager — 모든 메뉴 표시 + 승인 배지

### 2. page-access-control.spec.ts — 페이지 레벨 접근 차단

- TC-05: TE → /admin/approvals → /dashboard 리다이렉트
- TC-06: TE → /calibration-plans → API 403 또는 빈 상태
- TC-07: TE → /admin/audit-logs → API 403 또는 빈 상태
- TC-08: QM 읽기전용 — 장비 상세에서 수정/삭제 버튼 미표시
- TC-09: QM 읽기전용 — 반출 목록에서 생성 버튼 미표시
- TC-10: QM 읽기전용 — 교정계획서에서 작성 버튼 미표시 (검토만 가능)

### 3. approval-tabs.spec.ts — 승인 관리 탭 역할별 분리

- TC-11: TM — 8개 탭 표시 검증
- TC-12: QM — 1개 탭(plan_review) 표시 검증
- TC-13: LM — 3개 탭 표시 검증
- TC-14: 잘못된 탭 URL 접근 시 첫 번째 탭으로 자동 전환

### 4. equipment-crud-permissions.spec.ts — 장비 관리 CRUD 권한

- TC-15: TE — 장비 등록/수정 가능, 승인/폐기검토/폐기최종승인 불가
- TC-16: TM — 장비 등록/수정/승인/폐기검토 가능, 폐기최종승인 불가
- TC-17: QM — 장비 등록/수정/삭제 버튼 미표시
- TC-18: LM — 장비 등록/수정/삭제/승인/폐기검토/폐기최종승인 가능

### 5. module-crud-permissions.spec.ts — 반출/교정/NC/SW CRUD 권한

- TC-19: TE — 반출 생성 가능, 승인/반출시작/반입처리 불가
- TC-20: TM — 반출 생성/승인/반출시작/반입처리 가능
- TC-21: QM — 반출 생성 버튼 미표시
- TC-22: 교정 — TE/TM 등록 가능, LM 등록 불가 (직무분리)
- TC-23: NC — TE 등록/조치 가능, 종결승인 불가; TM 모두 가능
- TC-24: QM — NC 읽기전용 (등록/조치/승인 버튼 미표시)
