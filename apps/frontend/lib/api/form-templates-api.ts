import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';

export interface FormTemplateListItem {
  formNumber: string;
  name: string;
  retentionLabel: string;
  implemented: boolean;
  activeTemplate: {
    id: string;
    version: number;
    originalFilename: string;
    uploadedAt: string;
    uploadedBy: string | null;
  } | null;
}

export interface FormTemplateHistoryItem {
  id: string;
  formNumber: string;
  version: number;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  isActive: boolean;
  uploadedBy: string | null;
  uploadedAt: string;
}

export async function listFormTemplates(): Promise<FormTemplateListItem[]> {
  const response = await apiClient.get(API_ENDPOINTS.FORM_TEMPLATES.LIST);
  const data = response.data?.data ?? response.data;
  return data;
}

export async function downloadFormTemplate(formNumber: string): Promise<void> {
  const { downloadFile } = await import('./utils/download-file');
  await downloadFile({
    url: API_ENDPOINTS.FORM_TEMPLATES.DOWNLOAD(formNumber),
    filename: `${formNumber}_양식.docx`,
  });
}

export async function uploadFormTemplate(
  formNumber: string,
  file: File
): Promise<FormTemplateHistoryItem> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(API_ENDPOINTS.FORM_TEMPLATES.UPLOAD(formNumber), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return transformSingleResponse(response);
}

export async function getFormTemplateHistory(
  formNumber: string
): Promise<FormTemplateHistoryItem[]> {
  const response = await apiClient.get(API_ENDPOINTS.FORM_TEMPLATES.HISTORY(formNumber));
  const data = response.data?.data ?? response.data;
  return data;
}
