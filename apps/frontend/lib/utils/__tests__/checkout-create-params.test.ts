import { parseCheckoutCreateParams } from '../checkout-create-params';

describe('parseCheckoutCreateParams()', () => {
  describe('SearchParamsWithGet (URLSearchParams) 입력', () => {
    it('빈 입력 → 둘 다 null', () => {
      const result = parseCheckoutCreateParams(new URLSearchParams());
      expect(result).toEqual({ equipmentId: null, purpose: null });
    });

    it('equipmentId만 → equipmentId 설정, purpose null', () => {
      const result = parseCheckoutCreateParams(new URLSearchParams('equipmentId=equip-123'));
      expect(result.equipmentId).toBe('equip-123');
      expect(result.purpose).toBeNull();
    });

    it('유효 purpose만 → equipmentId null, purpose 설정', () => {
      const result = parseCheckoutCreateParams(new URLSearchParams('purpose=rental'));
      expect(result.equipmentId).toBeNull();
      expect(result.purpose).toBe('rental');
    });

    it('equipmentId + 유효 purpose → 둘 다 설정', () => {
      const result = parseCheckoutCreateParams(
        new URLSearchParams('equipmentId=equip-456&purpose=calibration')
      );
      expect(result.equipmentId).toBe('equip-456');
      expect(result.purpose).toBe('calibration');
    });

    it('잘못된 purpose 문자열 → purpose null', () => {
      const result = parseCheckoutCreateParams(
        new URLSearchParams('equipmentId=equip-789&purpose=invalid_purpose')
      );
      expect(result.equipmentId).toBe('equip-789');
      expect(result.purpose).toBeNull();
    });

    it('equipmentId 공백 문자열 → null (trim 후 빈 문자열은 null)', () => {
      const result = parseCheckoutCreateParams(new URLSearchParams('equipmentId=   '));
      expect(result.equipmentId).toBeNull();
    });
  });

  describe('Record 형식 입력 (plain object)', () => {
    it('Record input → SearchParamsWithGet과 동일 결과', () => {
      const fromRecord = parseCheckoutCreateParams({
        equipmentId: 'equip-rec-1',
        purpose: 'repair',
      });
      const fromSearchParams = parseCheckoutCreateParams(
        new URLSearchParams('equipmentId=equip-rec-1&purpose=repair')
      );
      expect(fromRecord).toEqual(fromSearchParams);
    });
  });
});
