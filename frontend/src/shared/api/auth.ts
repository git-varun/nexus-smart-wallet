// src/shared/api/auth.ts
import { apiClient, ApiResponse } from './client';
import { User } from '@/types/account';

export async function getAuthStatus(token?: string): Promise<ApiResponse<{ authenticated: boolean; user: User | null }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ authenticated: boolean; user: User | null }>('/api/auth/status', { headers });
}

export async function register(email: string, password: string): Promise<ApiResponse<{ user: User; token: string; refreshToken?: string }>> {
    return apiClient.request<{ user: User; token: string; refreshToken?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string; refreshToken?: string }>> {
    return apiClient.request<{ user: User; token: string; refreshToken?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function logout(refreshToken?: string): Promise<ApiResponse<any>> {
    return apiClient.request<any>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    });
}

export async function getProfile(token?: string): Promise<ApiResponse<User>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<User>('/api/profile', { headers });
}

export async function updateProfile(data: any, token?: string): Promise<ApiResponse<User>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<User>('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
    });
}

export async function checkUsernameAvailability(username: string, token?: string): Promise<ApiResponse<{ available: boolean }>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ available: boolean }>(`/api/username/check?username=${encodeURIComponent(username)}`, { headers });
}

export async function uploadAvatar(file: File, token?: string): Promise<ApiResponse<{ profileImageUrl: string }>> {
    const formData = new FormData();
    formData.append('profileImage', file);
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<{ profileImageUrl: string }>('/api/avatar/upload', {
        method: 'POST',
        headers,
        body: formData,
    });
}

export async function updateAvatarConfig(config: any, token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/avatar/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify(config),
    });
}

export async function deleteProfileImage(token?: string): Promise<ApiResponse<any>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<any>('/api/avatar', {
        method: 'DELETE',
        headers,
    });
}
