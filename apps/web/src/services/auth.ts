import { User, Login, CreateUser, ApiResponse } from '@gathercomb/shared';

const API_BASE_URL = import.meta.env?.VITE_API_URL ||
  (typeof window !== 'undefined' ? 'http://localhost:8080/api' : 'http://backend:8080/api');

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, errorData.error || 'Request failed');
  }

  return response.json();
}

export const authService = {
  async login(credentials: Login): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }

    return response.data!;
  },

  async signup(userData: CreateUser): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.success) {
      throw new Error(response.error || 'Signup failed');
    }

    return response.data!;
  },

  async logout(): Promise<void> {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiRequest<ApiResponse<User>>('/auth/me');

    if (!response.success) {
      throw new Error(response.error || 'Failed to get user');
    }

    return response.data!;
  },
};
