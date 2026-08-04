import apiClient from './client';
import type { ApiResponse, Restaurant, TemplateConfig } from '../types/menu';

export const getRestaurant = () =>
  apiClient.get<ApiResponse<{ restaurant: Restaurant }>>('/restaurants/me');

export const updateRestaurant = (data: Partial<Restaurant>) =>
  apiClient.put<ApiResponse<{ restaurant: Restaurant }>>('/restaurants/me', data);

export const updateTemplate = (config: TemplateConfig) =>
  apiClient.put<ApiResponse<{ restaurant: Restaurant }>>('/restaurants/me/template', { templateConfig: config });

export const getPublicMenu = (slug: string) =>
  apiClient.get<ApiResponse<{ restaurant: Restaurant; categories: import('../types/menu').Category[]; menuItems: import('../types/menu').MenuItem[] }>>(`/restaurants/${slug}/menu`);

