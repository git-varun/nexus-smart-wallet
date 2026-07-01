// src/shared/api/portfolio.ts
import { apiClient, ApiResponse } from './client';
import { object, PortfolioDto, portfolioDto } from './contracts';

export interface PortfolioPayload {
    portfolio: PortfolioDto;
}

const portfolioPayload = (value: unknown, path = 'data'): asserts value is PortfolioPayload => {
    const payload = object(value, path);
    portfolioDto(payload.portfolio, `${path}.portfolio`);
};

export async function getPortfolio(address: string, chainId: number, token?: string): Promise<ApiResponse<PortfolioPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<PortfolioPayload>(
        `/api/portfolio?address=${encodeURIComponent(address)}&chainId=${chainId}`,
        { headers },
        portfolioPayload
    );
}

export async function refreshPortfolio(address: string, chainId: number, token?: string): Promise<ApiResponse<PortfolioPayload>> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return apiClient.request<PortfolioPayload>('/api/portfolio/refresh', {
        method: 'POST',
        headers,
        body: JSON.stringify({ address, chainId }),
    }, portfolioPayload);
}
