/**
 * Saved Views API client — backend `/api/saved-views/*` 호출 SSOT.
 *
 * 모든 호출은 `API_ENDPOINTS.SAVED_VIEWS` 경유 (하드코딩 URL 0건).
 * 반환 타입은 backend `SavedView` row (id/name/params/ownerId/module/scope/teamId/sortOrder/version/timestamps).
 */
import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { SavedViewModule, SavedViewScope } from '@equipment-management/schemas';

export interface SavedView {
  id: string;
  name: string;
  params: string;
  ownerId: string;
  module: SavedViewModule;
  scope: SavedViewScope;
  teamId: string | null;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewPayload {
  name: string;
  params: string;
  module: SavedViewModule;
  scope: SavedViewScope;
  teamId?: string | null;
}

export interface UpdateSavedViewPayload {
  version: number;
  name?: string;
  params?: string;
  scope?: SavedViewScope;
  teamId?: string | null;
}

export interface ReorderSavedViewsPayload {
  module: SavedViewModule;
  orders: Array<{ id: string; sortOrder: number }>;
}

export interface BulkImportSavedViewsPayload {
  module: SavedViewModule;
  views: Array<{ name: string; params: string; sortOrder?: number }>;
}

export const savedViewsApi = {
  async list(module: SavedViewModule): Promise<SavedView[]> {
    const response = await apiClient.get(API_ENDPOINTS.SAVED_VIEWS.LIST, { params: { module } });
    return response.data as SavedView[];
  },

  async get(id: string): Promise<SavedView> {
    const response = await apiClient.get(API_ENDPOINTS.SAVED_VIEWS.GET(id));
    return response.data as SavedView;
  },

  async create(payload: CreateSavedViewPayload): Promise<SavedView> {
    const response = await apiClient.post(API_ENDPOINTS.SAVED_VIEWS.CREATE, payload);
    return response.data as SavedView;
  },

  async update(id: string, payload: UpdateSavedViewPayload): Promise<SavedView> {
    const response = await apiClient.patch(API_ENDPOINTS.SAVED_VIEWS.UPDATE(id), payload);
    return response.data as SavedView;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SAVED_VIEWS.DELETE(id));
  },

  async reorder(payload: ReorderSavedViewsPayload): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.SAVED_VIEWS.REORDER, payload);
  },

  async bulkImport(payload: BulkImportSavedViewsPayload): Promise<SavedView[]> {
    const response = await apiClient.post(API_ENDPOINTS.SAVED_VIEWS.BULK_IMPORT, payload);
    return response.data as SavedView[];
  },
};
