import apiClient from './client';
import type { ApiResponse, User } from '../types/menu';

interface AuthResponse {
  token: string;
  user: User;
}

export const login = (email: string, password: string) =>
  apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });

export const getMe = () =>
  apiClient.get<ApiResponse<User>>('/auth/me');
