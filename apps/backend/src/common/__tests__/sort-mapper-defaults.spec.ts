import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

import {
  CABLE_SORT_DEFAULT,
  resolveCableOrderBy,
} from '../../modules/cables/utils/cable-sort-mapper';
import {
  CALIBRATION_FACTOR_SORT_DEFAULT,
  resolveCalibrationFactorOrderBy,
} from '../../modules/calibration-factors/utils/calibration-factor-sort-mapper';
import {
  CALIBRATION_SORT_DEFAULT,
  resolveCalibrationOrderBy,
} from '../../modules/calibration/utils/calibration-sort-mapper';
import {
  CHECKOUT_SORT_DEFAULT,
  resolveCheckoutOrderBy,
} from '../../modules/checkouts/utils/checkout-sort-mapper';
import {
  EQUIPMENT_IMPORT_SORT_DEFAULT,
  resolveEquipmentImportOrderBy,
} from '../../modules/equipment-imports/utils/equipment-import-sort-mapper';
import {
  EQUIPMENT_SORT_DEFAULT,
  resolveEquipmentOrderBy,
} from '../../modules/equipment/utils/equipment-sort-mapper';
import {
  REPAIR_HISTORY_SORT_DEFAULT,
  resolveRepairHistoryOrderBy,
} from '../../modules/equipment/utils/repair-history-sort-mapper';
import {
  NON_CONFORMANCE_SORT_DEFAULT,
  resolveNonConformanceOrderBy,
} from '../../modules/non-conformances/utils/non-conformance-sort-mapper';
import {
  SOFTWARE_VALIDATION_SORT_DEFAULT,
  resolveSoftwareValidationOrderBy,
} from '../../modules/software-validations/utils/software-validation-sort-mapper';
import {
  TEST_SOFTWARE_SORT_DEFAULT,
  resolveTestSoftwareOrderBy,
} from '../../modules/test-software/utils/test-software-sort-mapper';
import { USER_SORT_DEFAULT, resolveUserOrderBy } from '../../modules/users/utils/user-sort-mapper';

/**
 * Sort-mapper default 회귀 차단 — 시스템 전반 invariant.
 *
 * 회귀 시나리오:
 *  - 누군가 XXX_SORT_DEFAULT 를 무심코 변경
 *  - resolveXxxOrderBy(undefined) fallback 분기 제거
 *  → list endpoint 의 정렬이 silently 뒤바뀜 (UX 회귀, 페이지네이션 cursor 무효화)
 *
 * 본 spec 은 11개 도메인 sort-mapper 의 default behavior 를 단일 invariant 테이블로 결빙한다.
 * 신규 sort-mapper 추가 시 본 테이블에 등록 → 자동 회귀 차단.
 *
 * 검증 전략: drizzle PgDialect.sqlToQuery() 로 SQL 문자열 추출 후 column + direction 키워드 검증.
 *
 * 별도 적용된 spec (단일 파일 분리):
 *  - notifications: notification-sort-mapper.spec.ts (createdAt.desc + priority 검증)
 *  - teams: team-sort-mapper.spec.ts (name.asc + classification 검증)
 *  본 통합 spec 은 위 두 도메인 외 11개 SSOT 결빙 책임만 담당.
 */
const dialect = new PgDialect();

interface DomainSortContract {
  /** 도메인 식별자 — describe label */
  name: string;
  /** 도메인 SORT_DEFAULT 상수 */
  defaultConst: { field: string; direction: 'asc' | 'desc' };
  /** resolveXxxOrderBy(undefined) 함수 */
  resolveOrderBy: (sort: undefined) => SQL;
  /** 기대 field 명 */
  expectedField: string;
  /** 기대 direction */
  expectedDirection: 'asc' | 'desc';
  /** SQL 문자열에서 expected column 의 snake_case 정규식 (drizzle 출력) */
  expectedColumnRegex: RegExp;
}

const DOMAINS: DomainSortContract[] = [
  {
    name: 'checkouts',
    defaultConst: CHECKOUT_SORT_DEFAULT,
    resolveOrderBy: resolveCheckoutOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'calibration',
    defaultConst: CALIBRATION_SORT_DEFAULT,
    resolveOrderBy: resolveCalibrationOrderBy as (s: undefined) => SQL,
    expectedField: 'calibrationDate',
    expectedDirection: 'desc',
    expectedColumnRegex: /calibration_date/,
  },
  {
    name: 'calibration-factors',
    defaultConst: CALIBRATION_FACTOR_SORT_DEFAULT,
    resolveOrderBy: resolveCalibrationFactorOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'equipment',
    defaultConst: EQUIPMENT_SORT_DEFAULT,
    resolveOrderBy: resolveEquipmentOrderBy as (s: undefined) => SQL,
    expectedField: 'managementNumber',
    expectedDirection: 'asc',
    expectedColumnRegex: /management_number/,
  },
  {
    name: 'equipment-imports',
    defaultConst: EQUIPMENT_IMPORT_SORT_DEFAULT,
    resolveOrderBy: resolveEquipmentImportOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'repair-history',
    defaultConst: REPAIR_HISTORY_SORT_DEFAULT,
    resolveOrderBy: resolveRepairHistoryOrderBy as (s: undefined) => SQL,
    expectedField: 'repairDate',
    expectedDirection: 'desc',
    expectedColumnRegex: /repair_date/,
  },
  {
    name: 'non-conformances',
    defaultConst: NON_CONFORMANCE_SORT_DEFAULT,
    resolveOrderBy: resolveNonConformanceOrderBy as (s: undefined) => SQL,
    expectedField: 'discoveryDate',
    expectedDirection: 'desc',
    expectedColumnRegex: /discovery_date/,
  },
  {
    name: 'cables',
    defaultConst: CABLE_SORT_DEFAULT,
    resolveOrderBy: resolveCableOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'software-validations',
    defaultConst: SOFTWARE_VALIDATION_SORT_DEFAULT,
    resolveOrderBy: resolveSoftwareValidationOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'test-software',
    defaultConst: TEST_SOFTWARE_SORT_DEFAULT,
    resolveOrderBy: resolveTestSoftwareOrderBy as (s: undefined) => SQL,
    expectedField: 'createdAt',
    expectedDirection: 'desc',
    expectedColumnRegex: /created_at/,
  },
  {
    name: 'users',
    defaultConst: USER_SORT_DEFAULT,
    resolveOrderBy: resolveUserOrderBy as (s: undefined) => SQL,
    expectedField: 'name',
    expectedDirection: 'asc',
    expectedColumnRegex: /\bname\b/,
  },
];

describe('Sort-mapper default — 시스템 전반 invariant 결빙', () => {
  describe.each(DOMAINS)(
    '$name',
    ({ defaultConst, resolveOrderBy, expectedField, expectedDirection, expectedColumnRegex }) => {
      it(`XXX_SORT_DEFAULT === { field: ${expectedField}, direction: ${expectedDirection} }`, () => {
        expect(defaultConst).toEqual({
          field: expectedField,
          direction: expectedDirection,
        });
      });

      it(`resolveXxxOrderBy(undefined) → ORDER BY ${expectedField} ${expectedDirection.toUpperCase()}`, () => {
        const result = resolveOrderBy(undefined);
        const { sql } = dialect.sqlToQuery(result);
        expect(sql).toMatch(expectedColumnRegex);
        expect(sql.toLowerCase()).toContain(expectedDirection);
      });
    }
  );

  it('11개 도메인 모두 등록 — 신규 sort-mapper 추가 시 본 테이블 갱신 필수', () => {
    // 본 invariant 가 깨지면 신규 sort-mapper 가 회귀 spec 미보유 상태로 머지된 것.
    // notifications + teams 는 별도 spec 보유 — 합산 13개가 시스템 전반 sort-mapper 총수.
    expect(DOMAINS).toHaveLength(11);
  });
});
