
const API_BASE = '/api/v1';

class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(text || `Request failed: ${res.status}`);
      (err as { status?: number }).status = res.status;
      throw err;
    }
    return res.json();
  }

  get<T>(path: string, params?: Record<string, any>) {
    // 过滤掉 undefined 和空字符串
    const filtered = params
      ? Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== ''
        )
      )
      : undefined;
    const qs = filtered && Object.keys(filtered).length > 0
      ? '?' + new URLSearchParams(filtered).toString()
      : '';
    return this.request<T>(path + qs);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }
}

export const apiClient = new ApiClient(API_BASE);