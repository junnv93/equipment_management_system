# Evaluation Report: user-signature

## 실행 시점
2026-04-06T15:30:00+09:00

## 반복 차수
1

## 빌드 검증
| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit -p apps/backend/tsconfig.json` | PASS (에러 0) |
| `pnpm --filter @equipment-management/schemas run build` | PASS |
| `pnpm --filter @equipment-management/db run build` | PASS |
| `pnpm --filter backend run build` | PASS |

## 계약 기준 평가

### 필수 (MUST)
| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| `users` 테이블에 `signature_image_path` 컬럼 존재 (varchar, nullable) | **PASS** | `packages/db/src/schema/users.ts:47` — `varchar('signature_image_path', { length: 500 })`, nullable (no `.notNull()`). DB 확인: `character varying(500)`, `is_nullable=YES` |
| Drizzle migration 파일 생성 + 적용 | **PASS** | `drizzle/0002_friendly_thor_girl.sql` — `ALTER TABLE "users" ADD COLUMN "signature_image_path" varchar(500);`. Journal entry idx=2 존재. `drizzle.__drizzle_migrations` 테이블에 hash `f16f5163...` 레코드 존재 |
| 서명 업로드 API 엔드포인트 존재 (PATCH or POST) | **PASS** | `users.controller.ts:170-200` — `@Post('me/signature')` with `@UseInterceptors(FileInterceptor('file'))` and `@UploadedFile() file: MulterFile` |
| `req.user.userId` 서버사이드 추출 | **PASS** | `users.controller.ts:184` — `const userId = req.user?.userId;` via `@Request() req: AuthenticatedRequest`. body에서 userId를 받지 않음 |
| 업로드 파일 검증: 이미지 타입만 허용, 크기 제한 | **PASS** | `users.controller.ts:53-54` — `SIGNATURE_ALLOWED_TYPES = ['image/png', 'image/jpeg']`, `SIGNATURE_MAX_SIZE = 2 * 1024 * 1024` (2MB). 검증 로직: lines 191-195 |

### 권장 (SHOULD)
| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| `@AuditLog()` 데코레이터 적용 | **PASS** | Upload: `@AuditLog({ action: 'update', entityType: 'user' })` (line 173). Delete: 동일 데코레이터 (line 204) |
| 이력카드 내보내기에서 서명 이미지 활용 가능한 구조 | **WARN** | `history-card.service.ts`에서 아직 `signatureImagePath` 참조 없음. 단, users 테이블에 경로가 저장되므로 구조적으로는 활용 가능. 실제 연동은 미구현 |

## 발견된 이슈

### Critical (MUST FAIL)
없음

### Warning (SHOULD FAIL)
1. **이력카드 서명 미연동**: `history-card.service.ts`가 `signatureImagePath`를 아직 사용하지 않음. 계약에서 "활용 가능한 구조"로 명시했으므로 구조적으로는 충족하나, 실제 활용 코드는 없음.

### Info
1. **DELETE 엔드포인트 존재**: `DELETE /users/me/signature` (line 202-216)가 구현되어 있어 서명 삭제도 가능. 다만 `deleteSignature`에서 `updateSignaturePath(userId, null)`만 호출하고 실제 파일 삭제(`fileUploadService.deleteFile`)는 호출하지 않음 — 고아 파일 발생 가능.
2. **FileUploadModule은 @Global()**: `file-upload.module.ts`에서 `@Global()` 데코레이터 적용됨. `UsersModule`에서 별도 import 불필요하며 실제로 import하지 않음 — 정상.
3. **Zod 스키마 업데이트 완료**: `packages/schemas/src/user.ts:36`에 `signatureImagePath: z.string().nullable().optional()` 추가됨.
4. **`@SkipPermissions()` 사용**: 업로드/삭제 엔드포인트 모두 `@SkipPermissions()`로 설정 — 자기 자신의 서명만 관리하므로 적절.

## 수리 지침
필수 기준 전체 PASS이므로 수리 불필요.

권장 사항 개선 시:
- `history-card.service.ts`에서 사용자 조회 시 `signatureImagePath`를 가져와 PDF/Excel 내보내기에 삽입하는 로직 추가 필요 (별도 태스크로 진행 권장)
- `DELETE /users/me/signature`에서 기존 파일 물리 삭제 로직 추가 고려 (`fileUploadService.deleteFile(oldPath)`)

## 종합 판정
**PASS**
