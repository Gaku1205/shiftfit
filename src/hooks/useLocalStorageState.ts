"use client";

import { useCallback, useSyncExternalStore } from "react";

type Updater<T> = T | ((prev: T) => T);

interface CacheEntry {
  raw: string | null;
  value: unknown;
}

const snapshotCache = new Map<string, CacheEntry>();

function updateEventName(key: string): string {
  return `shiftfit:local-update:${key}`;
}

function readParsed<T>(
  key: string,
  initialValue: T,
  isValid?: (value: unknown) => value is T,
): T {
  const raw = window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  let value: T = initialValue;
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isValid || isValid(parsed)) {
        value = parsed as T;
      }
    } catch {
      // 破損したJSONは初期値として扱う
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function subscribeToKey(key: string, callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(updateEventName(key), callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(updateEventName(key), callback);
  };
}

function noopSubscribe(): () => void {
  return () => {};
}

/**
 * SSRセーフなLocalStorageフック。useSyncExternalStoreにより、
 * サーバー/初回クライアント描画ではinitialValueを、ハイドレーション後は
 * 実際のLocalStorageの内容(isValidで型検証)を返す。
 * isHydratedがtrueになるまでは「本当の値」が確定していないため、
 * リダイレクト判定などはこのフラグを見てから行うこと。
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  isValid?: (value: unknown) => value is T,
): [T, (next: Updater<T>) => void, boolean] {
  const value = useSyncExternalStore(
    (callback) => subscribeToKey(key, callback),
    () => readParsed(key, initialValue, isValid),
    () => initialValue,
  );

  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const update = useCallback(
    (next: Updater<T>) => {
      const current = readParsed(key, initialValue, isValid);
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      const serialized = JSON.stringify(resolved);
      window.localStorage.setItem(key, serialized);
      snapshotCache.set(key, { raw: serialized, value: resolved });
      window.dispatchEvent(new Event(updateEventName(key)));
    },
    [key, initialValue, isValid],
  );

  return [value, update, isHydrated];
}
