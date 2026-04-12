/**
 * 모니터링 도메인 API 응답 타입 — SSOT
 *
 * 백엔드 `monitoring.service.ts` / `monitoring.controller.ts` 와
 * 프론트엔드 `monitoring-api.ts` 가 공유하는 단일 타입 정의.
 *
 * ## 설계 원칙
 *
 * 1. **미측정 필드는 `number | null`** — pg Pool 은 쿼리 실행 시간/slow query/
 *    lock wait 등을 직접 측정하지 않는다. `0` 을 반환하면 사용자가 "측정됨,
 *    값이 0" 으로 오해할 수 있으므로 `null` 로 명시한다. 향후 `pg_stat_statements`
 *    확장을 활성화하면 이 필드들이 실제 값으로 채워진다.
 *
 * 2. **`queriesExecuted` 는 근사치** — pg Pool 의 `acquire` 이벤트 카운트를
 *    매핑한다. 정확히는 "커넥션 획득 횟수" 이지만 일반적으로 쿼리 실행과
 *    1:1 에 가깝다. 향후 `connectionsAcquired` 로 rename 하는 것이 더 정확하나
 *    i18n / dashboard UX 연쇄 변경을 피하기 위해 본 SSOT 스프린트 범위에서
 *    제외. tech-debt-tracker 에 SHOULD 후속으로 등재.
 *
 * 3. **`ConnectionPoolMetrics` 는 재정의 금지** — `@equipment-management/db`
 *    에 이미 정의되어 있다. 본 파일은 그 위에 API 레이어 composite 타입만
 *    선언한다.
 */

// ============================================================
// DB 메트릭 (pg Pool 기반)
// ============================================================

/**
 * 데이터베이스 응용 레벨 메트릭
 *
 * `null` 필드: pg Pool 은 해당 지표를 측정할 수 없음. `pg_stat_statements`
 * 또는 별도 APM 미설치 상태에서의 정직한 표현.
 */
export interface DatabaseMetrics {
  /** pg Pool `connect` 이벤트 누적 카운트 */
  connectionsCreated: number;
  /** pg Pool `error` 이벤트 누적 카운트 */
  connectionErrors: number;
  /**
   * pg Pool `acquire` 이벤트 누적 카운트 (≈ 쿼리 실행 근사치).
   *
   * 정확한 "실행된 쿼리 수" 가 아니지만, acquire-query-release 패턴에서
   * 1 acquire ≈ 1 query 에 근사한다. 정확한 쿼리 카운트는
   * `pg_stat_statements.calls` 필요.
   */
  queriesExecuted: number;
  /** 쿼리 실패 카운트 — pg Pool error 이벤트 재사용 (approx) */
  queriesFailed: number;
  /** 평균 쿼리 실행 시간 (ms) — pg Pool 미측정, `pg_stat_statements` 필요 */
  avgQueryTime: number | null;
  /** 느린 쿼리 카운트 — 미측정 */
  slowQueries: number | null;
  /** 쿼리 캐시 적중률 (%) — 미측정 */
  queryCacheHitRate: number | null;
  /** 인덱스 사용률 (%) — 미측정 (`pg_stat_user_indexes` 필요) */
  indexUsage: number | null;
  /** Deadlock 카운트 — 미측정 (`pg_stat_database.deadlocks` 필요) */
  deadlocks: number | null;
  /** 락 대기 시간 (ms) — 미측정 */
  lockWaitTime: number | null;
}

/** 테이블 정보 — 현재는 비어있는 placeholder */
export interface TableInfo {
  name: string;
  rowCount: number;
  size: string;
}

/** 데이터베이스 진단 정보 (백엔드 getDatabaseDiagnostics 반환) */
export interface DatabaseDiagnostics {
  isSimulated: boolean;
  status: string;
  version: string;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  metrics: DatabaseMetrics;
  /** 테이블별 정보 — 현재 미구현 (빈 배열) */
  tablesInfo: TableInfo[];
  /** 복제 지연 (ms) — 미측정 */
  replicationLag: number | null;
}

// ============================================================
// Health Status (getHealthStatus 반환)
// ============================================================

/**
 * 헬스 체크용 축약 DB 메트릭 — diagnostic 의 일부.
 * 핵심 5개만 노출. nullable 필드 semantics 는 DatabaseMetrics 와 동일.
 */
export interface HealthDatabaseMetrics {
  connectionsCreated: number;
  connectionErrors: number;
  queriesExecuted: number;
  queriesFailed: number;
  avgQueryTime: number | null;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      isSimulated: boolean;
      metrics: HealthDatabaseMetrics;
    };
    system: {
      status: string;
      uptime: string;
      cpu: { usage: string; status: string };
      memory: { usage: string; status: string };
    };
    api: {
      status: string;
      totalRequests: number;
      errorRate: string;
    };
    logging: {
      status: string;
      counts: {
        error: number;
        warn: number;
        info: number;
        debug: number;
        verbose: number;
      };
    };
    cache: {
      status: string;
      hitRate: number;
    };
  };
  lastChecked: string;
}

// ============================================================
// HTTP Stats
// ============================================================

export interface HttpEndpointStat {
  endpoint: string;
  count: number;
  avgResponseTime: number;
}

export interface HttpStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  errorRate: number;
  topEndpoints: HttpEndpointStat[];
}

// ============================================================
// Cache Stats
// ============================================================

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

// ============================================================
// System Metrics (getSystemMetrics / monitoring metrics endpoint)
// ============================================================

export interface SystemMetrics {
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  release: string;
  nodeVersion: string;
  nodeEnv: string | undefined;
  cpu: {
    usage: number;
    loadAvg: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  network: {
    requestsPerMinute: number;
    errorRate: number;
    avgResponseTime: number;
    isSimulated: boolean;
  };
  storage: {
    diskUsage: number;
    diskFree: number;
    diskTotal: number;
    isSimulated: boolean;
  };
}

// ============================================================
// System Diagnostics (getDiagnostics 복합 응답)
// ============================================================

export interface SystemDiagnostics {
  system: SystemMetrics;
  database: DatabaseDiagnostics;
  http: HttpStats;
  timestamp: string;
  env: string | undefined;
  logging: {
    counts: {
      error: number;
      warn: number;
      info: number;
      debug: number;
      verbose: number;
    };
    lastErrors: never[];
  };
  performance: {
    isSimulated: boolean;
    responseTime: {
      avg: number;
      p95: number;
      p99: number;
    };
    throughput: number;
  };
  cache: CacheStats;
}
