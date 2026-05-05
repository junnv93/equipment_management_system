import { validationQuerySchema } from '../dto/validation-query.dto';

describe('validationQuerySchema — sort enum SSOT', () => {
  describe('sort — SoftwareValidationSortEnum', () => {
    it.each(['testDate.asc', 'testDate.desc', 'status.asc', 'createdAt.desc'])(
      'accepts: %s',
      (sort) => {
        expect(validationQuerySchema.safeParse({ sort }).success).toBe(true);
      }
    );
    it.each(['unknown.asc', 'testDate.INVALID', 'testDate.ASC', 'sql; DROP'])(
      'rejects: %s',
      (sort) => {
        expect(validationQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });

  it('omitted sort → undefined (no default)', () => {
    const r = validationQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sort).toBeUndefined();
  });
});
