import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * Identifier SSOT — 도메인 ID 생성의 단일 진입점.
 *
 * Node 빌트인 `crypto.randomUUID()`를 RFC 4122 v4 (CSPRNG) 형식으로 사용한다.
 * 호출처에서 raw `uuid` 패키지 import 또는 `randomUUID` 직접 import는 금지하고
 * 본 모듈의 도메인 의도 함수만 호출해야 한다 (verify-ssot Step 44).
 *
 * ## 두 가지 진입점
 *
 * 1. **`IdentifierService` 클래스** — NestJS `@Injectable()` 컴포넌트에서 DI로 주입.
 *    `data-migration.service`, `file-upload.service`, `form-template.service` 등.
 *
 * 2. **모듈 함수** (`generateAttachmentId`, `generateJti` 등) — `@Injectable()` 없는
 *    plain class / util / decorator에서 import. `OneTimeTokenService`처럼 DI를 우회하는
 *    경우(코어 라이브러리 패턴) 전용. SSOT 동일성 보장 — 둘 다 같은 `randomUUID()` 호출.
 *
 * 도메인 의도 함수를 분리한 이유는 vendor 캡슐화: 향후 알고리즘
 * 전환(ulid, nanoid, KSUID 등)이 필요할 때 호출처를 추적할 필요 없이
 * 본 모듈 내부만 변경하면 된다.
 */

// ─── Module-level functions (plain class / util 용) ────────────────────────

/**
 * 첨부 파일 / 업로드 자산의 스토리지 키 컴포넌트.
 * 파일 경로 패턴: `{subdirectory}/{generateAttachmentId()}.{ext}`
 */
export function generateAttachmentId(): string {
  return randomUUID();
}

/**
 * 데이터 마이그레이션 세션의 추적 ID.
 * 동일 세션 내 다중 시트 처리를 그룹화하는 용도.
 */
export function generateMigrationBatchId(): string {
  return randomUUID();
}

/**
 * JWT `jti` (JWT ID) 클레임 — 1회용 토큰 nonce 추적용.
 * Redis SET NX 키와 jti가 1:1 매핑되어 토큰 재사용을 차단.
 */
export function generateJti(): string {
  return randomUUID();
}

/**
 * 도메인 의미가 명확하지 않은 일반 불투명 식별자.
 * 가능하면 도메인 전용 함수를 신규 추가하고, 본 함수는 1회성 / 임시 ID에만 사용한다.
 *
 * @param prefix 옵션 prefix (예: 'tmp', 'job'). 빈 문자열이면 raw UUID 반환.
 */
export function generateOpaqueId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}-${id}` : id;
}

// ─── NestJS DI 진입점 (@Injectable 컴포넌트 용) ──────────────────────────

@Injectable()
export class IdentifierService {
  generateAttachmentId(): string {
    return generateAttachmentId();
  }

  generateMigrationBatchId(): string {
    return generateMigrationBatchId();
  }

  generateJti(): string {
    return generateJti();
  }

  generateOpaqueId(prefix?: string): string {
    return generateOpaqueId(prefix);
  }
}
