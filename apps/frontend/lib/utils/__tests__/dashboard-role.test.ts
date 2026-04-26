import { resolveDashboardRoleConfig } from '../dashboard-role';
import { DEFAULT_ROLE } from '@/lib/config/dashboard-config';

describe('resolveDashboardRoleConfig', () => {
  it('null → DEFAULT_ROLE', () => {
    const { role } = resolveDashboardRoleConfig(null);
    expect(role).toBe(DEFAULT_ROLE);
  });

  it('undefined → DEFAULT_ROLE', () => {
    const { role } = resolveDashboardRoleConfig(undefined);
    expect(role).toBe(DEFAULT_ROLE);
  });

  it('빈 문자열 → DEFAULT_ROLE', () => {
    const { role } = resolveDashboardRoleConfig('');
    expect(role).toBe(DEFAULT_ROLE);
  });

  it('대문자 role → 소문자로 정규화', () => {
    const { role } = resolveDashboardRoleConfig('TEST_ENGINEER');
    expect(role).toBe('test_engineer');
  });

  it('소문자 role → 그대로 사용', () => {
    const { role } = resolveDashboardRoleConfig('test_engineer');
    expect(role).toBe('test_engineer');
  });

  it('유효한 role → 해당 config 반환', () => {
    const { role, config } = resolveDashboardRoleConfig('lab_manager');
    expect(role).toBe('lab_manager');
    expect(config).toBeDefined();
    expect(config.controlCenter).toBeDefined();
  });

  it('미등록 role → DEFAULT_ROLE config fallback', () => {
    const { config: defaultConfig } = resolveDashboardRoleConfig(null);
    const { role, config } = resolveDashboardRoleConfig('unknown_role');
    expect(role).toBe('unknown_role');
    expect(config).toEqual(defaultConfig);
  });

  it('모든 표준 역할에 대해 config 반환', () => {
    const roles = [
      'test_engineer',
      'technical_manager',
      'quality_manager',
      'lab_manager',
      'system_admin',
    ];
    roles.forEach((r) => {
      const { config } = resolveDashboardRoleConfig(r);
      expect(config).toBeDefined();
    });
  });
});
