import { ForbiddenException } from '@nestjs/common';
import { FormTemplateExportService } from '../form-template-export.service';

describe('FormTemplateExportService.resolveSiteFilter', () => {
  // 순수 메서드 테스트 — 의존성(db/storage/formTemplateService) 불필요
  const service = new FormTemplateExportService({} as never, {} as never, {} as never);

  it('scoped user with matching ?site= returns scope.site', () => {
    expect(service.resolveSiteFilter({ site: 'suwon' }, { site: 'suwon' })).toBe('suwon');
  });

  it('scoped user without ?site= returns scope.site', () => {
    expect(service.resolveSiteFilter({}, { site: 'suwon' })).toBe('suwon');
  });

  it('scoped user with mismatched ?site= throws ForbiddenException', () => {
    expect(() => service.resolveSiteFilter({ site: 'incheon' }, { site: 'suwon' })).toThrow(
      ForbiddenException
    );
  });

  it('unscoped (admin) user with ?site= returns params.site', () => {
    expect(service.resolveSiteFilter({ site: 'incheon' }, undefined)).toBe('incheon');
  });

  it('unscoped (admin) user without ?site= returns undefined', () => {
    expect(service.resolveSiteFilter({}, undefined)).toBeUndefined();
  });
});
