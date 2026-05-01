/// <reference types="jest" />
/**
 * `getTokenForPermission()` 헬퍼 검증 (Phase 2/5 senior-permission-ssot-20260501).
 *
 * MUST 기준 (contract M3):
 * - hierarchy ascending 정렬 (narrowest first)
 * - quality_manager TestRole 미존재 시 actionable throw
 * - broaden=true 시 다음 hierarchy로 fallback
 * - dead permission throw
 * - error message는 4-place SSOT 갱신 가이드 + matched roles 노출
 */

import type { INestApplication } from '@nestjs/common';
import { Permission } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp } from '../test-app';
import {
  getTokenForPermission,
  type GetTokenForPermissionOptions,
} from '../test-permission-token';
import { TEST_USERS } from '../test-auth';

interface JwtPayload {
  email?: string;
  role?: string;
  roles?: string[];
  sub?: string;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('invalid jwt — no payload segment');
  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(decoded) as JwtPayload;
}

let app: INestApplication;

beforeAll(async () => {
  const ctx = await createTestApp();
  app = ctx.app;
});

afterAll(async () => {
  await closeTestApp(app);
});

describe('getTokenForPermission() — narrowest scope token resolver', () => {
  describe('hierarchy ascending — narrowest scope first', () => {
    it('CREATE_EQUIPMENT → test_engineer token (narrowest of 3 roles)', async () => {
      const token = await getTokenForPermission(app, Permission.CREATE_EQUIPMENT);
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.user.email);
    });

    it('APPROVE_CALIBRATION_PLAN → lab_manager token (narrowest of 2 roles)', async () => {
      const token = await getTokenForPermission(
        app,
        Permission.APPROVE_CALIBRATION_PLAN
      );
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.admin.email);
    });

    it('APPROVE_DISPOSAL → lab_manager token (UL-QP-18 §4.3 폐기 최종 승인)', async () => {
      const token = await getTokenForPermission(app, Permission.APPROVE_DISPOSAL);
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.admin.email);
    });

    it('MANAGE_SYSTEM_SETTINGS → lab_manager token (system_admin은 fallback only)', async () => {
      const token = await getTokenForPermission(app, Permission.MANAGE_SYSTEM_SETTINGS);
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.admin.email);
      expect(payload.email).not.toBe(TEST_USERS.systemAdmin.email);
    });

    it('APPROVE_CHECKOUT → technical_manager token (narrowest)', async () => {
      const token = await getTokenForPermission(app, Permission.APPROVE_CHECKOUT);
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.manager.email);
    });
  });

  describe('quality_manager TestRole 미존재 처리 — actionable throw', () => {
    it('REVIEW_CALIBRATION_PLAN throws (narrowest=quality_manager has no TestRole alias)', async () => {
      await expect(
        getTokenForPermission(app, Permission.REVIEW_CALIBRATION_PLAN)
      ).rejects.toThrow(/quality_manager/);
    });

    it('APPROVE_QUALITY_SOFTWARE_VALIDATION throws by default', async () => {
      await expect(
        getTokenForPermission(app, Permission.APPROVE_QUALITY_SOFTWARE_VALIDATION)
      ).rejects.toThrow(/quality_manager/);
    });

    it('throw message includes Step 23 4-place SSOT 갱신 가이드 + matched roles', async () => {
      try {
        await getTokenForPermission(app, Permission.REVIEW_CALIBRATION_PLAN);
        throw new Error('expected throw');
      } catch (err) {
        const msg = (err as Error).message;
        expect(msg).toContain('quality_manager');
        expect(msg).toMatch(/Step 23/);
        expect(msg).toContain(Permission.REVIEW_CALIBRATION_PLAN);
        expect(msg).toMatch(/matched roles:/);
        expect(msg).toContain('lab_manager');
        expect(msg).toContain('system_admin');
      }
    });
  });

  describe('broaden=true — fallback to next hierarchy', () => {
    it('REVIEW_CALIBRATION_PLAN with broaden=true → lab_manager fallback', async () => {
      const opts: GetTokenForPermissionOptions = { broaden: true };
      const token = await getTokenForPermission(
        app,
        Permission.REVIEW_CALIBRATION_PLAN,
        opts
      );
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.admin.email);
    });

    it('APPROVE_QUALITY_SOFTWARE_VALIDATION with broaden=true → lab_manager fallback', async () => {
      const token = await getTokenForPermission(
        app,
        Permission.APPROVE_QUALITY_SOFTWARE_VALIDATION,
        { broaden: true }
      );
      const payload = decodeJwtPayload(token);
      expect(payload.email).toBe(TEST_USERS.admin.email);
    });
  });

  describe('error path — dead permission', () => {
    it('Permission enum 외 값 → dead permission throw', async () => {
      const fakePermission = 'fake:nonexistent' as Permission;
      await expect(getTokenForPermission(app, fakePermission)).rejects.toThrow(
        /dead permission/
      );
    });

    it('dead permission throw message includes ROLE_PERMISSIONS 갱신 안내', async () => {
      const fakePermission = 'fake:nonexistent' as Permission;
      try {
        await getTokenForPermission(app, fakePermission);
        throw new Error('expected throw');
      } catch (err) {
        const msg = (err as Error).message;
        expect(msg).toContain('dead permission');
        expect(msg).toContain('ROLE_PERMISSIONS');
      }
    });
  });
});
