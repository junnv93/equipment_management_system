/**
 * CI 보안 게이트 스크립트: 엔드포인트 어노테이션 검증
 *
 * 검증 항목:
 * 1. @SiteScoped 또는 resolveDataScope 없이 데이터를 반환하는 목록 엔드포인트 탐지
 * 2. 허용 목록(whitelist) 외 @Public() 사용 탐지
 *
 * 실행: npx ts-node scripts/check-endpoint-annotations.ts
 * CI 통합: 위반 시 exit code 1 반환
 */

import * as fs from 'fs';
import * as path from 'path';

const MODULES_DIR = path.resolve(__dirname, '../src/modules');

// ─── 1. @SiteScoped 커버리지 설정 ──────────────────────────────────────────

/**
 * 반드시 데이터 스코프 어노테이션이 있어야 하는 컨트롤러.
 * CI에서 누락 시 빌드 실패.
 */
const REQUIRED_SCOPED_CONTROLLERS: Record<string, string> = {
  'equipment/equipment.controller.ts': '@SiteScoped({ policy: EQUIPMENT_DATA_SCOPE })',
  'checkouts/checkouts.controller.ts': '@SiteScoped({ policy: CHECKOUT_DATA_SCOPE })',
  'non-conformances/non-conformances.controller.ts': '@SiteScoped({ policy: NON_CONFORMANCE_DATA_SCOPE })',
  'calibration/calibration.controller.ts': '@SiteScoped({ policy: CALIBRATION_DATA_SCOPE })',
  'equipment-imports/equipment-imports.controller.ts': '@SiteScoped({ policy: EQUIPMENT_IMPORT_DATA_SCOPE })',
  'calibration-plans/calibration-plans.controller.ts': '@SiteScoped({ policy: CALIBRATION_PLAN_DATA_SCOPE, siteField: "siteId" })',
  'audit/audit.controller.ts': 'resolveDataScope (AUDIT_LOG_SCOPE)',
  'users/users.controller.ts': '@SiteScoped({ policy: USER_DATA_SCOPE })',
};

/**
 * 데이터 스코프가 의도적으로 없는 컨트롤러 (면제 목록).
 * 이 목록에 있는 컨트롤러는 @Get() 목록 엔드포인트가 있어도 경고하지 않음.
 *
 * 면제 사유를 주석으로 반드시 기재할 것.
 */
const EXEMPTED_CONTROLLERS: Record<string, string> = {
  // 인증 관련 — 모든 엔드포인트가 @Public() 또는 JWT 검증 전 처리
  'auth/auth.controller.ts': '인증 엔드포인트, 로그인 전 접근 필요',
  'auth/test-auth.controller.ts': '테스트 환경 전용 인증 헬퍼',

  // 참조 데이터 — 모든 사용자가 전체 데이터 필요 (장비 등록 시 팀/사이트 선택)
  'teams/teams.controller.ts': '참조 데이터, 장비 등록 시 팀 선택 드롭다운에 전체 팀 필요',
  'calibration-factors/calibration-factors.controller.ts': '참조 데이터, site 필드 없음',

  // 사용자별 필터링 — site 기반이 아닌 JWT userId 기반 필터링
  'notifications/notifications.controller.ts': 'userId 기반 필터링 (SseController 포함)',

  // 시스템 관리 — 관리자 전용, site 범위 개념 없음
  'monitoring/monitoring.controller.ts': '시스템 모니터링, @InternalApiKey 보호',
  'dashboard/dashboard.controller.ts': '집계 통계, 역할별 범위는 서비스 내부에서 처리',
  'settings/settings.controller.ts': '시스템 설정, 관리자 전용',

  // 엔티티별 하위 경로 — 상위 엔티티로 권한 체크, 별도 스코프 불필요
  'approvals/approvals.controller.ts': '엔티티별 승인 요청 집계, 상위 엔티티 권한으로 보호',
  'software/software.controller.ts': '소프트웨어 이력, 장비 UUID 기반 접근',
  'reports/reports.controller.ts': '리포트 생성, 역할 기반 권한 체크',
};

// ─── 2. @Public() 허용 목록 ─────────────────────────────────────────────────

/**
 * @Public() 사용이 허용된 컨트롤러 파일명 패턴.
 *
 * @Public()은 글로벌 JwtAuthGuard를 우회하지만, 반드시 대안적 인증/인가 수단이 있어야 합니다:
 * - @UseGuards(InternalApiKeyGuard): X-Internal-Api-Key 헤더로 서비스간 통신 인가
 * - @UseGuards(SseJwtAuthGuard): query param JWT로 SSE 스트림 인증
 * - 로그인/헬스체크: 인증 전 접근이 필요한 공개 엔드포인트
 */
const PUBLIC_WHITELIST_PATTERNS: string[] = [
  // 인증 관련 — 로그인, 토큰 갱신 등 인증 전 접근 필요
  'auth.controller.ts',
  'test-auth.controller.ts', // 테스트 환경 전용

  // 헬스체크 — /health 공개 엔드포인트
  'monitoring.controller.ts',

  // 서비스간 통신 — @Public() + @UseGuards(InternalApiKeyGuard)로 보호
  'equipment.controller.ts',   // POST /cache/invalidate (X-Internal-Api-Key)
  'users.controller.ts',       // POST /sync (X-Internal-Api-Key)

  // SSE 스트림 — @Public() + @UseGuards(SseJwtAuthGuard)로 보호
  'notification-sse.controller.ts', // query param JWT 검증
];

// ─── 3. 유틸리티 함수 ───────────────────────────────────────────────────────

/**
 * 디렉토리를 재귀적으로 탐색하여 *.controller.ts 파일 목록 반환
 */
function findControllerFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findControllerFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── 4. 검증 로직 ────────────────────────────────────────────────────────────

interface Violation {
  type: 'MISSING_SCOPE' | 'UNAUTHORIZED_PUBLIC';
  severity: 'ERROR' | 'WARNING';
  file: string;
  detail: string;
}

const violations: Violation[] = [];

/**
 * 파일 내용에서 데이터 스코프 어노테이션 존재 여부 확인
 */
function hasDataScopeAnnotation(content: string): boolean {
  return content.includes('@SiteScoped') || content.includes('resolveDataScope');
}

/**
 * 파일 내용에서 bare @Get() 목록 엔드포인트 존재 여부 확인
 * @Get(':param') 같은 상세 조회는 제외
 */
function hasBareGetEndpoint(content: string): boolean {
  // @Get() 또는 @Get('') 패턴 (경로 파라미터 없음)
  return /\@Get\(\s*(?:''|"")?\s*\)/.test(content);
}

/**
 * 파일 내용에서 @Public() 사용 여부 확인
 */
function hasPublicDecorator(content: string): boolean {
  return /@Public\(\)/.test(content);
}

/**
 * 파일 경로를 MODULES_DIR 상대 경로로 변환
 */
function toRelativePath(filePath: string): string {
  return path.relative(MODULES_DIR, filePath);
}

function runChecks() {
  const controllerFiles = findControllerFiles(MODULES_DIR);

  console.log(`\n검사 대상: ${controllerFiles.length}개 컨트롤러 파일\n`);

  // ─── Check 1: @SiteScoped 커버리지 ─────────────────────────────────────

  // 1a. REQUIRED_SCOPED 목록 컨트롤러 검증 (빌드 실패 수준)
  for (const [relativePath, expectedAnnotation] of Object.entries(REQUIRED_SCOPED_CONTROLLERS)) {
    const fullPath = path.join(MODULES_DIR, relativePath);

    if (!fs.existsSync(fullPath)) {
      violations.push({
        type: 'MISSING_SCOPE',
        severity: 'ERROR',
        file: relativePath,
        detail: `파일이 존재하지 않음 (이동 또는 삭제 시 REQUIRED_SCOPED_CONTROLLERS 목록 업데이트 필요)`,
      });
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!hasDataScopeAnnotation(content)) {
      violations.push({
        type: 'MISSING_SCOPE',
        severity: 'ERROR',
        file: relativePath,
        detail: `필수 데이터 스코프 어노테이션 누락. 예상 패턴: ${expectedAnnotation}`,
      });
    }
  }

  // 1b. 알 수 없는 컨트롤러 — @Get() 있지만 스코프 없으면 경고
  for (const filePath of controllerFiles) {
    const relativePath = toRelativePath(filePath);

    // 이미 체크된 목록은 건너뜀
    if (relativePath in REQUIRED_SCOPED_CONTROLLERS) continue;
    if (relativePath in EXEMPTED_CONTROLLERS) continue;

    const content = fs.readFileSync(filePath, 'utf-8');

    if (hasBareGetEndpoint(content) && !hasDataScopeAnnotation(content)) {
      violations.push({
        type: 'MISSING_SCOPE',
        severity: 'WARNING',
        file: relativePath,
        detail: `@Get() 목록 엔드포인트가 있지만 @SiteScoped 또는 resolveDataScope 없음. ` +
                `의도적이면 EXEMPTED_CONTROLLERS에 사유를 기재하세요.`,
      });
    }
  }

  // ─── Check 2: @Public() 허용 목록 검증 ─────────────────────────────────

  for (const filePath of controllerFiles) {
    const relativePath = toRelativePath(filePath);
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!hasPublicDecorator(content)) continue;

    const isWhitelisted = PUBLIC_WHITELIST_PATTERNS.some((pattern) => fileName.includes(pattern));

    if (!isWhitelisted) {
      violations.push({
        type: 'UNAUTHORIZED_PUBLIC',
        severity: 'ERROR',
        file: relativePath,
        detail: `@Public() 사용이 허용 목록에 없습니다. 인증 우회가 의도된 경우 ` +
                `PUBLIC_WHITELIST_PATTERNS에 사유와 함께 추가하세요.`,
      });
    }
  }

  // ─── 결과 출력 ──────────────────────────────────────────────────────────

  const errors = violations.filter((v) => v.severity === 'ERROR');
  const warnings = violations.filter((v) => v.severity === 'WARNING');

  if (errors.length > 0) {
    console.error('❌ [ERROR] 보안 게이트 위반:');
    for (const v of errors) {
      console.error(`  [${v.type}] ${v.file}`);
      console.error(`    → ${v.detail}`);
    }
    console.error('');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  [WARNING] 검토 필요:');
    for (const v of warnings) {
      console.warn(`  [${v.type}] ${v.file}`);
      console.warn(`    → ${v.detail}`);
    }
    console.warn('');
  }

  // 통과 목록 출력
  const checkedFiles = new Set([
    ...Object.keys(REQUIRED_SCOPED_CONTROLLERS),
    ...Object.keys(EXEMPTED_CONTROLLERS),
  ]);
  console.log(`✅ REQUIRED_SCOPED 검사: ${Object.keys(REQUIRED_SCOPED_CONTROLLERS).length}개`);
  console.log(`✅ EXEMPTED 면제 목록: ${Object.keys(EXEMPTED_CONTROLLERS).length}개`);
  console.log(`✅ 총 검사된 컨트롤러: ${controllerFiles.length}개`);
  console.log(`✅ 미분류 컨트롤러: ${controllerFiles.length - checkedFiles.size}개`);
  console.log('');

  if (errors.length > 0) {
    console.error(`\n보안 게이트 실패: ${errors.length}개 ERROR, ${warnings.length}개 WARNING`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`보안 게이트 통과 (${warnings.length}개 WARNING — 검토 권장)`);
  } else {
    console.log('보안 게이트 통과 — 모든 엔드포인트 어노테이션 정상');
  }
}

runChecks();
