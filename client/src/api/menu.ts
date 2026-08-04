import apiClient from './client';
import type { ApiResponse, MenuItem } from '../types/menu';

export const getMenuItems = (categoryId?: string) => {
  const params = categoryId ? { category: categoryId } : {};
  return apiClient.get<ApiResponse<{ menuItems: MenuItem[] }>>('/menu-items', { params });
};

export const createMenuItem = (data: Partial<MenuItem>) =>
  apiClient.post<ApiResponse<{ menuItem: MenuItem }>>('/menu-items', data);

export const updateMenuItem = (id: string, data: Partial<MenuItem>) =>
  apiClient.put<ApiResponse<{ menuItem: MenuItem }>>(`/menu-items/${id}`, data);

export const deleteMenuItem = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/menu-items/${id}`);

export const reorderMenuItems = (items: { id: string; order: number }[]) =>
  apiClient.put<ApiResponse<null>>('/menu-items/reorder', { items });

export const toggleAvailability = (id: string) =>
  apiClient.patch<ApiResponse<{ menuItem: MenuItem }>>(`/menu-items/${id}/toggle`);

