# 문서 관리 시스템 프론트엔드 UI 구현

## 배경

백엔드 API와 기본 프론트엔드 컴포넌트가 이미 구현되어 있습니다:

### 기존 구현 (건드리지 말 것)
- **백엔드**: `apps/backend/src/modules/documents/` — 전체 CRUD + 개정 + 무결성 검증 + 보존 스케줄러
- **DB 스키마**: `packages/db/src/schema/documents.ts`
- **프론트엔드 API 클라이언트**: `apps/frontend/lib/api/document-api.ts` — 모든 API 메서드 구현 완료
- **AttachmentsTab**: `apps/frontend/components/equipment/AttachmentsTab.tsx` — 장비 상세 첨부파일 탭
- **DocumentRevisionDialog**: `apps/frontend/components/shared/DocumentRevisionDialog.tsx` — 버전 이력
- **CalibrationRegisterDialog**: 교정 등록 시 인증서 업로드

### 백엔드 API 엔드포인트
```
POST   /api/documents              — 파일 업로드 (documentType, equipmentId/calibrationId/requestId)
GET    /api/documents              — 목록 조회 (?equipmentId=&type=&includeCalibrations=true)
GET    /api/documents/:id/download — 다운로드 (S3 presigned URL / 로컬 스트림)
DELETE /api/documents/:id          — 소프트 삭제
GET    /api/documents/:id/verify   — SHA-256 무결성 검증
POST   /api/documents/:id/revisions — 개정 업로드
GET    /api/documents/:id/revisions — 개정 이력 (재귀 CTE)
```

## 구현 요청

### Phase 1: 독립 문서 관리 페이지 (`/documents`)

전체 시스템의 문서를 검색/필터/관리하는 대시보드 페이지를 구현합니다.

**기능 요구사항:**
1. 장비명/관리번호/파일명으로 전체 문서 검색
2. 문서 유형(CALIBRATION_CERTIFICATE, RAW_DATA, INSPECTION_REPORT, HISTORY_CARD)별 필터
3. 상태(active/superseded/deleted) 필터
4. 장비별 그룹핑 뷰 / 플랫 리스트 뷰 토글
5. 다운로드, 삭제, 무결성 검증 인라인 액션
6. 개정 이력 보기 (기존 DocumentRevisionDialog 재사용)
7. 새 문서 업로드 다이얼로그 (장비 선택 → 파일 업로드)

**기술 요구사항:**
- Next.js 16 App Router: `app/(dashboard)/documents/page.tsx` (서버 컴포넌트) + `DocumentsContent.tsx` (클라이언트)
- URL-driven 필터 (searchParams SSOT) — `lib/utils/document-filter-utils.ts` + `hooks/use-document-filters.ts`
- TanStack Query + `queryKeys.documents.*` 팩토리 등록 (`lib/api/query-config.ts`)
- `useOptimisticMutation` 패턴 (삭제 시)
- 역할별 권한: `useAuth().can(Permission.DELETE_EQUIPMENT)` → 삭제 버튼 조건부 렌더링
- i18n: `messages/en/documents.json` + `messages/ko/documents.json`
- Design tokens 사용 (`@/lib/design-tokens`)
- `PageHeader` 컴포넌트 사용

### Phase 2: 문서 미리보기

- PDF: `<iframe>` 또는 `react-pdf` (dynamic import)
- 이미지: `<img>` with zoom
- 기타: 다운로드 유도

### Phase 3: 추가 첨부 포인트

- 부적합(NC) 기록에 증빙자료 첨부 (`components/non-conformances/`)
- 반출 요청에 관련 문서 첨부 (`components/checkouts/`)

## 참고 패턴

구현 시 다음 기존 파일을 참고하세요:
- **URL 필터 SSOT**: `lib/utils/equipment-filter-utils.ts` + `hooks/use-equipment-filters.ts`
- **페이지 구조**: `app/(dashboard)/equipment/page.tsx` → `EquipmentContent.tsx`
- **API 클라이언트**: `lib/api/document-api.ts` (이미 완성)
- **캐시 무효화**: `lib/api/cache-invalidation.ts`
- **테이블 UI**: `components/equipment/EquipmentTable.tsx`
- **빈 상태**: `EQUIPMENT_EMPTY_STATE_TOKENS`

## 주의사항

- `/equipment-management` 스킬을 먼저 로드하여 도메인 지식 확인
- `/nextjs-16` 스킬로 App Router 패턴 확인
- 구현 완료 후 `/verify-implementation` 실행
- 구현 완료 후 `/review-architecture` 실행
