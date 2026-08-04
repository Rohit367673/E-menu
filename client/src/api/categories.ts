import apiClient from './client';
import type { ApiResponse, Category } from '../types/menu';

export const getCategories = () =>
  apiClient.get<ApiResponse<{ categories: Category[] }>>('/categories');

export const createCategory = (data: Partial<Category>) =>
  apiClient.post<ApiResponse<{ category: Category }>>('/categories', data);

export const updateCategory = (id: string, data: Partial<Category>) =>
  apiClient.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);

export const deleteCategory = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`/categories/${id}`);

export const reorderCategories = (items: { id: string; order: number }[]) =>
  apiClient.put<ApiResponse<null>>('/categories/reorder', { items });

