---
name: 다음 세션 TODO
description: 47차 세션 — 전자서명 미리보기 아키텍처 완료, 다음 우선순위 정리
type: project
originSessionId: 4b4c12f2-47e1-4c44-9623-7d9f534fffbb
---
2026-04-13 47차 세션 완료.

## 최근 세션 성과

### 47차: 전자서명 미리보기 아키텍처 개선 (feat/files-serve-endpoint, PR #195)
- **백엔드** `GET /api/files/:subdir/:filename` 엔드포인트 신규 (FilesController)
  - S3/RustFS: JSON { presignedUrl } 반환 (documents API와 동일 패턴)
  - Local FS: 바이너리 스트리밍 + Cache-Control: private, max-age=3600
  - Path traversal 방지, @SkipPermissions + 전역 JwtAuthGuard
- **SSOT** `API_ENDPOINTS.FILES.SERVE` 추가, `EXTENSION_TO_MIME` 교체 (verify-hardcoding 이슈 해결)
- **프론트** `StorageImage` 공유 컴포넌트 + `fetchStorageFileUrl` 유틸
  - TanStack Query (staleTime=MEDIUM, gcTime=SHORT) + queryKeys.storageFiles SSOT
  - Blob URL 생명주기 관리 (useRef + useEffect revoke)
- **ProfileContent**: 인라인 blob URL 로직 → <StorageImage> 교체 (DRY)
- **verify-* 스킬** 3개 업데이트 (verify-hardcoding, verify-security, verify-frontend-state)

## 다음 우선순위

### A. verify-design-tokens 발견 (이월)
- SelfInspectionTab.tsx:66-75 — JUDGMENT_COLORS/STATUS_COLORS 하드코딩 → getJudgmentBadgeClasses 등으로 교체

### B. review-architecture Warning (이월)
- AttachmentsTab, FormTemplatesTable의 aria-label이 문자열 연결 방식 → i18n 키 interpolation으로 통일

### C. 이전 세션에서 이월
- approvals-api.ts: checkout/disposal/equipment-request mapper의 단일 `as Record` cast 10건
- relation type SSOT: {id, name, email, team} 패턴 3곳 중복 → 공통 타입 추출 검토
