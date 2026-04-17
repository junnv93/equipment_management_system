import {
  mergeAccessoriesAndFunctions,
  mergeManualAndSoftware,
} from '../services/history-card-data.service';

describe('mergeAccessoriesAndFunctions', () => {
  it('accessories + description 둘 다 있을 때 개행으로 병합하고 "주요기능:" prefix 추가', () => {
    const result = mergeAccessoriesAndFunctions(
      'RF 케이블 3m x2, 전용 캐리어',
      'RF 신호 스펙트럼 측정 및 주파수 분석'
    );
    expect(result).toBe(
      'RF 케이블 3m x2, 전용 캐리어\n주요기능: RF 신호 스펙트럼 측정 및 주파수 분석'
    );
  });

  it('accessories만 있으면 그대로 반환 (주요기능 라벨 없이)', () => {
    expect(mergeAccessoriesAndFunctions('케이블 5m', null)).toBe('케이블 5m');
    expect(mergeAccessoriesAndFunctions('케이블 5m', '')).toBe('케이블 5m');
    expect(mergeAccessoriesAndFunctions('케이블 5m', '   ')).toBe('케이블 5m');
  });

  it('description만 있으면 "주요기능:" prefix 포함', () => {
    expect(mergeAccessoriesAndFunctions(null, '신호 분석')).toBe('주요기능: 신호 분석');
    expect(mergeAccessoriesAndFunctions('', '신호 분석')).toBe('주요기능: 신호 분석');
  });

  it('둘 다 없으면 "-" fallback', () => {
    expect(mergeAccessoriesAndFunctions(null, null)).toBe('-');
    expect(mergeAccessoriesAndFunctions('', '')).toBe('-');
    expect(mergeAccessoriesAndFunctions('  ', '  ')).toBe('-');
  });

  it('앞뒤 공백은 trim된 결과를 병합', () => {
    const result = mergeAccessoriesAndFunctions('  부속품  ', '  기능  ');
    expect(result).toBe('부속품\n주요기능: 기능');
  });
});

describe('mergeManualAndSoftware', () => {
  it('manual_location + test_software 리스트 + firmware 모두 있을 때 3줄 병합', () => {
    const result = mergeManualAndSoftware(
      'A동 201호 캐비닛',
      [
        { name: 'IECSoft', managementNumber: 'P0045', version: '5.2.1' },
        { name: 'EMC32', managementNumber: 'P0046', version: null },
      ],
      'A.25.41'
    );
    expect(result).toBe(
      '보관장소: A동 201호 캐비닛\n' +
        'S/W: P0045 IECSoft v5.2.1\n' +
        'S/W: P0046 EMC32\n' +
        'FW: A.25.41'
    );
  });

  it('manual_location만 있으면 보관장소만', () => {
    expect(mergeManualAndSoftware('B동 3층', [], null)).toBe('보관장소: B동 3층');
  });

  it('test_software만 있으면 S/W 라인만', () => {
    const result = mergeManualAndSoftware(
      null,
      [{ name: 'IECSoft', managementNumber: 'P0045', version: '5.2.1' }],
      null
    );
    expect(result).toBe('S/W: P0045 IECSoft v5.2.1');
  });

  it('firmware만 있으면 FW 라인만', () => {
    expect(mergeManualAndSoftware(null, [], 'v1.2.3')).toBe('FW: v1.2.3');
  });

  it('S/W 버전이 null이면 "v" 접미사 없이 이름만 표시', () => {
    const result = mergeManualAndSoftware(
      null,
      [{ name: 'CustomSW', managementNumber: 'P0099', version: null }],
      null
    );
    expect(result).toBe('S/W: P0099 CustomSW');
  });

  it('모두 없으면 "-" fallback', () => {
    expect(mergeManualAndSoftware(null, [], null)).toBe('-');
    expect(mergeManualAndSoftware('', [], '')).toBe('-');
  });

  it('공백만 있는 manual_location은 생략', () => {
    const result = mergeManualAndSoftware(
      '   ',
      [{ name: 'Test', managementNumber: 'P0001', version: '1.0' }],
      null
    );
    expect(result).toBe('S/W: P0001 Test v1.0');
  });

  it('여러 S/W가 등록되면 모두 개별 라인으로 표시 (순서 보존)', () => {
    const result = mergeManualAndSoftware(
      null,
      [
        { name: 'A', managementNumber: 'P0001', version: '1.0' },
        { name: 'B', managementNumber: 'P0002', version: '2.0' },
        { name: 'C', managementNumber: 'P0003', version: null },
      ],
      null
    );
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('P0001 A v1.0');
    expect(lines[1]).toContain('P0002 B v2.0');
    expect(lines[2]).toContain('P0003 C');
  });
});
