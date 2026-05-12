/**
 * Saved Views DTO Zod 검증 spec — 5-layer defense-in-depth Layer 1.
 *
 * 검증 시나리오:
 * - name min/max 경계
 * - params LONG_CSV_MAX_LENGTH 경계 (1000자)
 * - scope enum (PRIVATE/TEAM/GLOBAL) + 잘못된 값 reject
 * - module enum (checkouts) + 잘못된 값 reject
 * - update DTO version 필수 + 양수 정수
 * - reorder DTO 개수 경계 (1~50)
 * - bulkImport MAX_SAVED_VIEWS_PER_MODULE(5) 초과 reject
 * - .strict() — unknown key reject (security)
 */
import { createSavedViewSchema } from '../dto/create-saved-view.dto';
import { updateSavedViewSchema } from '../dto/update-saved-view.dto';
import { reorderSavedViewsSchema } from '../dto/reorder-saved-views.dto';
import { bulkImportSavedViewsSchema } from '../dto/bulk-import-saved-views.dto';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('Saved Views DTOs', () => {
  describe('createSavedViewSchema', () => {
    it('happy path PRIVATE 통과', () => {
      const result = createSavedViewSchema.safeParse({
        name: '진행 중',
        params: 'status=APPROVED&purpose=CAL',
        module: 'checkouts',
        scope: 'PRIVATE',
      });
      expect(result.success).toBe(true);
    });

    it('TEAM scope + teamId 통과', () => {
      const result = createSavedViewSchema.safeParse({
        name: '팀 뷰',
        params: 'status=PENDING',
        module: 'checkouts',
        scope: 'TEAM',
        teamId: VALID_UUID,
      });
      expect(result.success).toBe(true);
    });

    it('이름이 빈 문자열이면 거부', () => {
      const result = createSavedViewSchema.safeParse({
        name: '',
        params: 'a=b',
        module: 'checkouts',
        scope: 'PRIVATE',
      });
      expect(result.success).toBe(false);
    });

    it('이름이 80자 초과면 거부', () => {
      const result = createSavedViewSchema.safeParse({
        name: 'a'.repeat(81),
        params: 'a=b',
        module: 'checkouts',
        scope: 'PRIVATE',
      });
      expect(result.success).toBe(false);
    });

    it('params 가 1000자 초과면 거부', () => {
      const result = createSavedViewSchema.safeParse({
        name: 'X',
        params: 'a'.repeat(1001),
        module: 'checkouts',
        scope: 'PRIVATE',
      });
      expect(result.success).toBe(false);
    });

    it('scope 가 enum 이외 값이면 거부', () => {
      const result = createSavedViewSchema.safeParse({
        name: 'X',
        params: 'a=b',
        module: 'checkouts',
        scope: 'PUBLIC',
      });
      expect(result.success).toBe(false);
    });

    it('module 이 enum 이외 값이면 거부', () => {
      const result = createSavedViewSchema.safeParse({
        name: 'X',
        params: 'a=b',
        module: 'equipment',
        scope: 'PRIVATE',
      });
      expect(result.success).toBe(false);
    });

    it('알려지지 않은 key 는 .strict() 로 거부 (ownerId 위조 차단)', () => {
      const result = createSavedViewSchema.safeParse({
        name: 'X',
        params: 'a=b',
        module: 'checkouts',
        scope: 'PRIVATE',
        ownerId: VALID_UUID, // Rule 2 위반 시도
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSavedViewSchema', () => {
    it('version 만 있어도 통과 (no-op 갱신 허용)', () => {
      const result = updateSavedViewSchema.safeParse({ version: 1 });
      expect(result.success).toBe(true);
    });

    it('version 0 거부 (CAS 양수 정수만)', () => {
      const result = updateSavedViewSchema.safeParse({ version: 0, name: 'X' });
      expect(result.success).toBe(false);
    });

    it('version 누락 시 거부', () => {
      const result = updateSavedViewSchema.safeParse({ name: 'X' });
      expect(result.success).toBe(false);
    });

    it('이름 + scope 변경 통과', () => {
      const result = updateSavedViewSchema.safeParse({
        version: 3,
        name: '갱신 뷰',
        scope: 'TEAM',
        teamId: VALID_UUID,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('reorderSavedViewsSchema', () => {
    it('happy path 통과', () => {
      const result = reorderSavedViewsSchema.safeParse({
        module: 'checkouts',
        orders: [
          { id: VALID_UUID, sortOrder: 0 },
          { id: '22222222-2222-4222-8222-222222222222', sortOrder: 1 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('빈 배열 거부 (min 1)', () => {
      const result = reorderSavedViewsSchema.safeParse({
        module: 'checkouts',
        orders: [],
      });
      expect(result.success).toBe(false);
    });

    it('50개 초과 거부 (max 50)', () => {
      const result = reorderSavedViewsSchema.safeParse({
        module: 'checkouts',
        orders: Array.from({ length: 51 }, (_, i) => ({
          id: '11111111-1111-4111-8111-111111111111',
          sortOrder: i,
        })),
      });
      expect(result.success).toBe(false);
    });

    it('sortOrder 음수 거부', () => {
      const result = reorderSavedViewsSchema.safeParse({
        module: 'checkouts',
        orders: [{ id: VALID_UUID, sortOrder: -1 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkImportSavedViewsSchema', () => {
    it('happy path 통과', () => {
      const result = bulkImportSavedViewsSchema.safeParse({
        module: 'checkouts',
        views: [
          { name: 'A', params: 'status=PENDING' },
          { name: 'B', params: 'purpose=CAL' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('빈 배열 허용 (idempotent no-op)', () => {
      const result = bulkImportSavedViewsSchema.safeParse({
        module: 'checkouts',
        views: [],
      });
      expect(result.success).toBe(true);
    });

    it('5개 초과 거부 (MAX_SAVED_VIEWS_PER_MODULE)', () => {
      const result = bulkImportSavedViewsSchema.safeParse({
        module: 'checkouts',
        views: Array.from({ length: 6 }, (_, i) => ({
          name: `View ${i}`,
          params: `a=${i}`,
        })),
      });
      expect(result.success).toBe(false);
    });
  });
});
