import apiClient from './client';
import type { ApiResponse } from '../types/menu';

export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post<ApiResponse<{ url: string }>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
