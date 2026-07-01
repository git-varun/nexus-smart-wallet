// src/shared/api/auth.ts
import { apiClient, ApiResponse } from './client';
import { User } from '@/types/account';
import { boolean, object, optional, string, undefinedValue, userDto } from './contracts';

export interface AuthStatusPayload {
    authenticated: boolean;
    user?: User;
    smartAccountAddress?: string;
}

const authStatusPayload = (value: unknown, path = 'data'): asserts value is AuthStatusPayload => {
    const payload = object(value, path);
    boolean(payload.authenticated, `${path}.authenticated`);
    if (payload.user != null) userDto(payload.user, `${path}.user`);
    optional(payload.smartAccountAddress, string, `${path}.smartAccountAddress`);
};

export interface AuthPayload {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: string;
}

const authPayload = (value: unknown, path = 'data'): asserts value is AuthPayload => {
    const payload = object(value, path);
    userDto(payload.user, `${path}.user`);
    string(payload.token, `${path}.token`);
    string(payload.refreshToken, `${path}.refreshToken`);
    string(payload.expiresAt, `${path}.expiresAt`);
};

export async function getAuthStatus(token?: string): Promise<ApiResponse<AuthStatusPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<AuthStatusPayload>('/api/auth/status', { headers }, authStatusPayload);
}

export async function register(email: string, password: string): Promise<ApiResponse<AuthPayload>> {
    return apiClient.request<AuthPayload>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }, authPayload);
}

export async function login(email: string, password: string): Promise<ApiResponse<AuthPayload>> {
    return apiClient.request<AuthPayload>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }, authPayload);
}

export async function logout(refreshToken?: string): Promise<ApiResponse<undefined>> {
    return apiClient.request<undefined>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    }, undefinedValue);
}

export interface UserPayload {
    user: User;
}

const userPayload = (value: unknown, path = 'data'): asserts value is UserPayload => {
    const payload = object(value, path);
    userDto(payload.user, `${path}.user`);
};

export async function getProfile(token?: string): Promise<ApiResponse<UserPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<UserPayload>('/api/profile', { headers }, userPayload);
}

export interface UserProfileUpdate {
    username?: string;
    displayName?: string;
    preferences?: Record<string, unknown>;
}

export async function updateProfile(data: UserProfileUpdate, token?: string): Promise<ApiResponse<UserPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<UserPayload>('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
    }, userPayload);
}

export interface UsernameAvailabilityPayload {
    username: string;
    available: boolean;
    suggestions?: string[];
}

export async function checkUsernameAvailability(username: string, token?: string): Promise<ApiResponse<UsernameAvailabilityPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<UsernameAvailabilityPayload>(
        `/api/username/check?username=${encodeURIComponent(username)}`,
        { headers },
        (value, path = 'data'): asserts value is UsernameAvailabilityPayload => {
            const payload = object(value, path);
            string(payload.username, `${path}.username`);
            boolean(payload.available, `${path}.available`);
            if (payload.suggestions !== undefined) {
                if (!Array.isArray(payload.suggestions)) throw new Error(`${path}.suggestions must be an array`);
                payload.suggestions.forEach((item, index) => string(item, `${path}.suggestions[${index}]`));
            }
        }
    );
}

export interface AvatarUploadPayload {
    profileImageUrl: string;
    user: User;
}

export async function uploadAvatar(file: File, token?: string): Promise<ApiResponse<AvatarUploadPayload>> {
    const formData = new FormData();
    formData.append('profileImage', file);
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<AvatarUploadPayload>('/api/avatar/upload', {
        method: 'POST',
        headers,
        body: formData,
    }, (value, path = 'data'): asserts value is AvatarUploadPayload => {
        const payload = object(value, path);
        string(payload.profileImageUrl, `${path}.profileImageUrl`);
        userDto(payload.user, `${path}.user`);
    });
}

export async function updateAvatarConfig(config: Record<string, unknown>, token?: string): Promise<ApiResponse<UserPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<UserPayload>('/api/avatar/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ avatarConfig: config }),
    }, userPayload);
}

export async function deleteProfileImage(token?: string): Promise<ApiResponse<UserPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<UserPayload>('/api/avatar', {
        method: 'DELETE',
        headers,
    }, userPayload);
}
