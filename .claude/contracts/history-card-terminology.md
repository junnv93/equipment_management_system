---
slug: history-card-terminology
title: 시험설비이력카드(UL-QP-18-02) UI 용어 정합성
created: 2026-04-17
---

## Scope

시험설비이력카드(UL-QP-18-02) 양식과 프론트엔드 UI 간의 용어 불일치를 수정.
DB 스키마/API 변경 없음. i18n 라벨 + FIELD_LABELS + BasicInfoTab 필드 추가.

## MUST Criteria

1. **i18n 라벨 정합**: `fields.technicalManager` → "운영책임자 (정)", `fields.deputyManager` → "운영책임자 (부)"
2. **일련번호 통일**: `fields.serialNumber` → "일련번호" (equipment.json fields 섹션)
3. **제조사명 통일**: `fields.manufacturer` → "제조사명"
4. **FIELD_LABELS 정합**: `packages/schemas/src/field-labels.ts`에 equipment 섹션의 `technicalManager`, `deputyManagerId`, `initialLocation`, `installationDate` 등 누락 필드 추가 + 용어 통일
5. **BasicInfoTab 누락 필드**: `initialLocation`(최초 설치 위치), `installationDate`(설치일시) 표시
6. **tsc 통과**: 이번 변경으로 인한 새로운 타입 에러 없음
7. **RBAC 역할명 불변**: `dashboard.json`, `common.json`, `navigation.json`, `approvals.json`의 역할명 "기술책임자"는 변경하지 않음 (시스템 역할명 ≠ 양식 필드명)
8. **하드코딩 없음**: 새로 추가/수정한 라벨은 모두 i18n 또는 SSOT 상수를 통해 참조

## SHOULD Criteria

1. 감사로그 i18n (`audit.json`)의 장비 필드 라벨도 양식 용어와 일관
2. 승인 관련 i18n (`approvals.json`)의 장비 필드 라벨도 양식 용어와 일관
3. 다른 i18n 파일 간 같은 필드에 대해 서로 다른 라벨이 없을 것
