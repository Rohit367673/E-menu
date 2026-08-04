import apiClient from './client';

export type ExportTemplateId = 'modern-cafe' | 'dark-restaurant' | 'classic-menu';

export async function exportMenu(template: ExportTemplateId, format: 'pdf' | 'png') {
  return apiClient.post('/export/menu', { template, format }, { responseType: 'blob' });
}
