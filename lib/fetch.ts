import { useState, useEffect, useCallback } from "react";

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const fetchAPI = async <T = unknown>(
  url: string,
  options?: FetchOptions,
): Promise<T> => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    ...fetchOptions
  } = options ?? {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ||
            `HTTP error! status: ${response.status}`,
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(id);

      const isNetworkError =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.toLowerCase().includes("network"));

      if (isNetworkError && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unreachable");
};

export const useFetch = <T>(
  url: string,
  options?: RequestInit,
): FetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI<{ data: T }>(url, options);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
