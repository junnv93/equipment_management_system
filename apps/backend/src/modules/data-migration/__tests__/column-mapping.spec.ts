/**
 * 컬럼 매핑 상수 테스트
 *
 * 검증 항목:
 * 1. getTemplateHeader() SSOT — generateTemplate()과 buildAliasIndex() 양쪽의 단일 진실
 * 2. 시트별 deprecated alias 격리 — 크로스시트 오염 방지
 * 3. 모든 시트의 alias index round-trip 보장
 */
import {
  COLUMN_ALIAS_INDEX,
  EQUIPMENT_COLUMN_MAPPING,
  DEPRECATED_EQUIPMENT_COLUMNS,
  DEPRECATED_EQUIPMENT_ALIAS_SET,
  DEPRECATED_CALIBRATION_ALIAS_SET,
  DEPRECATED_ALIAS_BY_SHEET,
  buildAliasIndex,
  buildAliasSet,
  getTemplateHeader,
} from '../constants/equipment-column-mapping';
import {
  CALIBRATION_ALIAS_INDEX,
  CALIBRATION_COLUMN_MAPPING,
} from '../constants/calibration-column-mapping';
import { REPAIR_ALIAS_INDEX, REPAIR_COLUMN_MAPPING } from '../constants/repair-column-mapping';
import {
  INCIDENT_ALIAS_INDEX,
  INCIDENT_COLUMN_MAPPING,
} from '../constants/incident-column-mapping';
import { CABLE_ALIAS_INDEX, CABLE_COLUMN_MAPPING } from '../constants/cable-column-mapping';
import {
  TEST_SOFTWARE_ALIAS_INDEX,
  TEST_SOFTWARE_COLUMN_MAPPING,
} from '../constants/test-software-column-mapping';
import {
  CALIBRATION_FACTOR_ALIAS_INDEX,
  CALIBRATION_FACTOR_COLUMN_MAPPING,
} from '../constants/calibration-factor-column-mapping';
import {
  NON_CONFORMANCE_ALIAS_INDEX,
  NON_CONFORMANCE_COLUMN_MAPPING,
} from '../constants/non-conformance-column-mapping';

// ── getTemplateHeader SSOT 검증 ──────────────────────────────────────────────

describe('getTemplateHeader (SSOT)', () => {
  it('headerLabel이 있으면 그대로 반환해야 한다', () => {
    const entry = { dbField: 'site', aliases: ['사이트'], headerLabel: '사이트(수원/의왕) *' };
    expect(getTemplateHeader(entry)).toBe('사이트(수원/의왕) *');
  });

  it('headerLabel 없고 required이면 "alias[0] *"를 반환해야 한다', () => {
    const entry = { dbField: 'name', aliases: ['장비명'], required: true };
    expect(getTemplateHeader(entry)).toBe('장비명 *');
  });

  it('headerLabel 없고 optional이면 "alias[0]"을 반환해야 한다', () => {
    const entry = { dbField: 'assetNumber', aliases: ['자산번호'] };
    expect(getTemplateHeader(entry)).toBe('자산번호');
  });
});

// ── Template Round-Trip — 모든 시트 ─────────────────────────────────────────

describe('Template Round-Trip', () => {
  const allSheets = [
    { name: 'equipment', index: COLUMN_ALIAS_INDEX, mapping: EQUIPMENT_COLUMN_MAPPING },
    { name: 'calibration', index: CALIBRATION_ALIAS_INDEX, mapping: CALIBRATION_COLUMN_MAPPING },
    { name: 'repair', index: REPAIR_ALIAS_INDEX, mapping: REPAIR_COLUMN_MAPPING },
    { name: 'incident', index: INCIDENT_ALIAS_INDEX, mapping: INCIDENT_COLUMN_MAPPING },
    { name: 'cable', index: CABLE_ALIAS_INDEX, mapping: CABLE_COLUMN_MAPPING },
    {
      name: 'test-software',
      index: TEST_SOFTWARE_ALIAS_INDEX,
      mapping: TEST_SOFTWARE_COLUMN_MAPPING,
    },
    {
      name: 'calibration-factor',
      index: CALIBRATION_FACTOR_ALIAS_INDEX,
      mapping: CALIBRATION_FACTOR_COLUMN_MAPPING,
    },
    {
      name: 'non-conformance',
      index: NON_CONFORMANCE_ALIAS_INDEX,
      mapping: NON_CONFORMANCE_COLUMN_MAPPING,
    },
  ];

  it.each(allSheets)(
    '$name: getTemplateHeader() 결과가 alias index에서 매핑 가능해야 한다',
    ({ index, mapping }) => {
      for (const entry of mapping) {
        const header = getTemplateHeader(entry);
        const key = header.toLowerCase().trim();
        const found = index.get(key);
        expect(found).toBeDefined();
        expect(found?.dbField).toBe(entry.dbField);
      }
    }
  );

  it.each(allSheets)('$name: alias index가 빈 Map이 아니어야 한다', ({ index }) => {
    expect(index.size).toBeGreaterThan(0);
  });
});

// ── Deprecated Aliases — 시트별 격리 ────────────────────────────────────────

describe('Deprecated Aliases - Sheet Isolation', () => {
  it('장비 시트 deprecated alias가 장비 alias index에 없어야 한다', () => {
    for (const entry of DEPRECATED_EQUIPMENT_COLUMNS) {
      for (const alias of entry.aliases) {
        expect(COLUMN_ALIAS_INDEX.has(alias.toLowerCase().trim())).toBe(false);
      }
    }
  });

  it('DEPRECATED_ALIAS_BY_SHEET에 모든 시트 타입이 등록되어야 한다', () => {
    const expectedSheets = [
      'equipment',
      'calibration',
      'test_software',
      'repair',
      'incident',
      'cable',
      'calibration_factor',
      'non_conformance',
    ];
    for (const sheet of expectedSheets) {
      expect(DEPRECATED_ALIAS_BY_SHEET[sheet]).toBeDefined();
      expect(DEPRECATED_ALIAS_BY_SHEET[sheet]).toBeInstanceOf(Set);
    }
  });

  it('크로스시트 오염 방지 — 교정 deprecated "교정비용"이 장비 시트 deprecated에 없어야 한다', () => {
    // "교정비용"은 교정 시트의 deprecated이지, 장비 시트의 deprecated가 아님
    expect(DEPRECATED_EQUIPMENT_ALIAS_SET.has('교정비용')).toBe(false);
    expect(DEPRECATED_CALIBRATION_ALIAS_SET.has('교정비용')).toBe(true);
  });

  it('deprecated 없는 시트는 빈 Set이어야 한다', () => {
    const sheetsWithoutDeprecated = [
      'repair',
      'incident',
      'cable',
      'calibration_factor',
      'non_conformance',
    ];
    for (const sheet of sheetsWithoutDeprecated) {
      expect(DEPRECATED_ALIAS_BY_SHEET[sheet].size).toBe(0);
    }
  });

  it('대표적인 deprecated 장비 컬럼이 시트별 Set에 포함되어야 한다', () => {
    const equipmentDeprecated = [
      '공용여부',
      '담당자이메일',
      '부담당자이메일',
      '소유처',
      '외부식별번호',
    ];
    for (const header of equipmentDeprecated) {
      expect(DEPRECATED_EQUIPMENT_ALIAS_SET.has(header.toLowerCase())).toBe(true);
    }
  });
});

// ── buildAliasIndex 유닛 테스트 ──────────────────────────────────────────────

describe('buildAliasIndex', () => {
  it('aliases + getTemplateHeader() 결과 모두 등록해야 한다', () => {
    const testMapping = [
      {
        dbField: 'testField',
        aliases: ['테스트', 'Test'],
        headerLabel: '테스트(힌트)',
        required: true,
      },
    ];

    const index = buildAliasIndex(testMapping);

    // aliases
    expect(index.get('테스트')?.dbField).toBe('testField');
    expect(index.get('test')?.dbField).toBe('testField');
    // getTemplateHeader → headerLabel 우선
    expect(index.get('테스트(힌트)')?.dbField).toBe('testField');
  });

  it('headerLabel 없는 required 필드는 getTemplateHeader가 "alias[0] *"를 반환하여 인덱싱', () => {
    const testMapping = [{ dbField: 'requiredField', aliases: ['필수항목'], required: true }];
    const index = buildAliasIndex(testMapping);

    expect(index.get('필수항목')?.dbField).toBe('requiredField');
    expect(index.get('필수항목 *')?.dbField).toBe('requiredField');
  });

  it('optional 필드는 "alias[0] *"가 인덱싱되지 않아야 한다', () => {
    const testMapping = [{ dbField: 'optionalField', aliases: ['선택항목'] }];
    const index = buildAliasIndex(testMapping);

    expect(index.get('선택항목')?.dbField).toBe('optionalField');
    expect(index.has('선택항목 *')).toBe(false);
  });
});

// ── buildAliasSet 유닛 테스트 ────────────────────────────────────────────────

describe('buildAliasSet', () => {
  it('대소문자 무시 + 트림하여 Set을 생성해야 한다', () => {
    const columns = [
      { dbField: 'a', aliases: ['Hello ', ' WORLD'] },
      { dbField: 'b', aliases: ['Test'] },
    ];
    const set = buildAliasSet(columns);
    expect(set.has('hello')).toBe(true);
    expect(set.has('world')).toBe(true);
    expect(set.has('test')).toBe(true);
    expect(set.size).toBe(3);
  });
});
