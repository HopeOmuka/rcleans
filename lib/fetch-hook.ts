"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { get, isAbortError } from '@/lib/fetch';
import { logger } from '@/lib/logger';

const MAX_AUTO_RETRIES = 3;

interface UseFetchOptions<T> {
  retryOnError?: boolean;
  refetchInterval?: number;
  enabled?: boolean;
  staleWhileRevalidate?: boolean;
  cacheTime?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T | ((currentData: T | null) => T)) => void;
}

const cache = new Map<string, { data: any; timestamp: number; }>();

export function useFetch<T>(
  url: string,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    retryOnError = true,
    refetchInterval,
    enabled = true,
    staleWhileRevalidate = false,
    cacheTime = 5 * 60 * 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoRetryCountRef = useRef(0);
  const loadingRef = useRef(false);
  const inFlightRef = useRef(false);
  const dataRef = useRef<T | null>(null);

  const fetchData = useCallback(async (isManualRefetch = false) => {
    if (!enabled) return;

    const cached = cache.get(url);
    const isStaleNow =
      !staleWhileRevalidate ||
      !dataRef.current ||
      !cached ||
      Date.now() - cached.timestamp > cacheTime;

    if (!isManualRefetch && (!isStaleNow || loadingRef.current || inFlightRef.current)) {
      return;
    }

    if (isManualRefetch && (loadingRef.current || inFlightRef.current)) {
      return;
    }

    inFlightRef.current = true;

    if (isManualRefetch) {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
    }

    try {
      if (cached && !isManualRefetch) {
        setData(cached.data);
        dataRef.current = cached.data;
      }

      const response = await get<T>(url);
      const fetched = (response &&
      typeof response === "object" &&
      "data" in response
        ? (response as { data: T }).data
        : response) as T;
      dataRef.current = fetched;
      setData(fetched);
      cache.set(url, { data: fetched, timestamp: Date.now() });
      setError(null);
      autoRetryCountRef.current = 0;

      logger.info('Data fetched successfully', { url });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to fetch data', { url, error: errorMessage });

      if (retryOnError && autoRetryCountRef.current < MAX_AUTO_RETRIES && !isAbortError(err)) {
        autoRetryCountRef.current += 1;
        logger.info('Retrying fetch after error', { url, attempt: autoRetryCountRef.current });
        setTimeout(() => fetchData(true), 2000);
      }
    } finally {
      inFlightRef.current = false;
      if (isManualRefetch) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [url, enabled, retryOnError, staleWhileRevalidate, cacheTime]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((newData: T | ((currentData: T | null) => T)) => {
    setData(prev => {
      const updated = typeof newData === 'function'
        ? (newData as (currentData: T | null) => T)(prev as T)
        : newData;
      dataRef.current = updated;
      return updated;
    });
    cache.delete(url);
  }, [url]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    if (refetchInterval && enabled) {
      intervalRef.current = setTimeout(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
        }
      };
    }
  }, [url, enabled, refetchInterval, fetchData]);

  return { data, loading, error, refetch, mutate };
}
