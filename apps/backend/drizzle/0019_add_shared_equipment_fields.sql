-- Migration: 0019_add_shared_equipment_fields.sql
-- Description: 공용장비 관리를 위한 필드 추가 (isShared, sharedSource)
-- Date: 2026-01-19

-- 공용장비 여부 필드 추가 (기본값 false로 기존 데이터 호환성 유지)
ALTER TABLE "equipment" ADD COLUMN "is_shared" boolean NOT NULL DEFAULT false;

-- 공용장비 출처 필드 추가 (nullable, 'safety_lab' | 'external' | null)
ALTER TABLE "equipment" ADD COLUMN "shared_source" varchar(50);

-- 공용장비 검색 최적화를 위한 인덱스 추가
CREATE INDEX "equipment_is_shared_idx" ON "equipment" ("is_shared");
