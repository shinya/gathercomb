import { Board, CreateBoard, ApiResponse } from '@gathercomb/shared';

const API_BASE_URL = import.meta.env?.VITE_API_URL ||
  (typeof window !== 'undefined' ? 'http://localhost:8080/api' : 'http://backend:8080/api');

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

  async deleteBoard(boardId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(`/boards/${boardId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete board');
    }
  },
};
