import { Board, CreateBoard, UpdateBoard, ApiResponse } from '@gathercomb/shared';
import { getCsrfToken } from '../utils/csrf';

const API_BASE_URL = import.meta.env?.VITE_API_URL ||
  (typeof window !== 'undefined' ? 'http://localhost:8080/api' : 'http://backend:8080/api');

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add CSRF token for state-changing requests
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Request failed');
  }

  return response.json();
}

export const boardService = {
  async getUserBoards(): Promise<Board[]> {
    const response = await apiRequest<ApiResponse<Board[]>>('/boards');

    if (!response.success) {
      throw new Error(response.error || 'Failed to load boards');
    }

    return response.data!;
  },

  async createBoard(boardData: CreateBoard): Promise<Board> {
    const response = await apiRequest<ApiResponse<Board>>('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create board');
    }

    return response.data!;
  },

  async getBoard(boardId: string): Promise<Board> {
    const response = await apiRequest<ApiResponse<Board>>(`/boards/${boardId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to load board');
    }

    return response.data!;
  },

  async updateBoard(boardId: string, updates: UpdateBoard): Promise<Board> {
    const response = await apiRequest<ApiResponse<Board>>(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update board');
    }

    return response.data!;
  },

  async deleteBoard(boardId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(`/boards/${boardId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete board');
    }
  },

  async getMembers(boardId: string): Promise<Array<{userId: string; email: string; displayName: string; role: string}>> {
    const response = await apiRequest<ApiResponse<Array<{userId: string; email: string; displayName: string; role: string}>>>(`/boards/${boardId}/members`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to load members');
    }

    return response.data!;
  },

  async updateMemberRole(boardId: string, userId: string, role: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(`/boards/${boardId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update member role');
    }
  },

  async removeMember(boardId: string, userId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(`/boards/${boardId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove member');
    }
  },
};
