import { logger } from '@/lib/logger';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

const fetchImpl: FetchFunction = globalThis.fetch;

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | { data: T; error?: never }
  | (ApiErrorBody & { data?: never });

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.name === 'Aborted' || /aborted/i.test(error.message);
  }
  return false;
}

export class APIFetchError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'APIFetchError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 3,
    headers = {},
    ...restOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      signal: controller.signal,
    };

    let lastError: Error = new Error("Fetch failed");

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await fetchImpl(url, fetchOptions);
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > 3000) {
          logger.warn(`Slow API call: ${url} took ${duration}ms`);
        }

        if (!response.ok) {
          let errorData;
          let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
          let errorCode = "API_ERROR";

          const rawText = await response.text();
          let parsed: any = null;
          try {
            parsed = JSON.parse(rawText);
          } catch {
            // Plain-text error body (e.g. Metro route errors)
          }
          if (parsed && typeof parsed === "object") {
            errorData = parsed;
            errorMessage = parsed.message || errorMessage;
            errorCode = parsed.errorCode || errorCode;
          } else {
            errorData = rawText;
          }

          const apiError = new APIFetchError(errorMessage, response.status, errorCode, errorData);
          logger.error(`API call failed: ${url}`, {
            status: response.status,
            statusText: response.statusText,
            attempt,
            totalRetries: retries,
          });
          throw apiError;
        }

        const data = await response.json();
        logger.info(`API call successful: ${url}`, {
          duration,
          status: response.status,
        });

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isAbortError(lastError)) {
          logger.warn(`API call aborted, skipping retries: ${url}`, {
            error: lastError.message,
          });
          throw lastError;
        }

        const noRetryStatus =
          lastError instanceof APIFetchError &&
          lastError.statusCode >= 400 &&
          lastError.statusCode < 500 &&
          lastError.statusCode !== 408 &&
          lastError.statusCode !== 429;

        if (attempt < retries && !noRetryStatus) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.warn(`Retrying API call: ${url} (attempt ${attempt}/${retries}), waiting ${delay}ms`, {
            error: lastError.message,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`API call failed after retries: ${url}`, {
          error: lastError.message,
          attempts: attempt,
          totalRetries: retries,
        });
        throw lastError;
      }
    }

    throw lastError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fetchAPI<T>(url: string, options?: FetchOptions): Promise<T> {
  return fetchWithRetry<T>(url, options || {});
}

export namespace fetchAPI {
  export function get<T>(url: string, options?: FetchOptions): Promise<T> {
    return fetchWithRetry<T>(url, options || {});
  }

  export function post<T>(url: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return fetchWithRetry<T>(url, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }
}

export const get = fetchAPI.get;
