const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorised: (() => void) | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  /** Register a callback that fires when a 401 response is received (e.g. expired token). */
  onUnauthorisedResponse(callback: () => void): void {
    this.onUnauthorised = callback;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      // BUG-007: Auto-logout on 401 (expired/revoked token)
      if (response.status === 401 && this.onUnauthorised) {
        this.onUnauthorised();
      }
      throw new ApiError(response.status, body.error ?? 'Request failed', body.details ?? body);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Do not set Content-Type — browser will set multipart boundary automatically
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 && this.onUnauthorised) {
        this.onUnauthorised();
      }
      throw new ApiError(response.status, body.error ?? 'Upload failed', body.details);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
