import {Dispatch, SetStateAction, useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

function listenerF<Key extends ValidCacheKey, Value> (
    setOfKeys: Set<Key>,
    setResult: Dispatch<SetStateAction<Readonly<Record<Key, Value>>>>
): CacheListener<Key, Value> {
  return (cacheKey: Key, value: Value | undefined) => {
    if (setOfKeys.has(cacheKey)) {
      if (value === undefined) {
        setResult(oldResult => {
          if (oldResult[cacheKey] === value) return oldResult;
          const newResult = {...oldResult};
          delete newResult[cacheKey];
          return newResult;
        });
      } else {
        setResult(oldResult => {
          if (oldResult[cacheKey] === value) return oldResult;
          return {...oldResult, [cacheKey]: value};
        });
      }
    }
  };
}

export default function cacheValuesHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) : ((cacheKeys: readonly Key[]) => Record<Key, Value>) {

  function useCacheValues (cacheKeys: readonly Key[]): Record<Key, Value> {
    const setOfKeys = useMemo(() => new Set<Key>(cacheKeys), [cacheKeys]);

    const [result, setResult] = useState<Readonly<Record<Key, Value>>>(() => {
      const initial = {} as Record<Key, Value>;
      for (const key of cacheKeys) {
        const value = cache.memoryCache[key];
        if (value !== undefined) {
          initial[key] = value;
        }
      }
      return initial;
    });

    /** we use temporary listener until first call of useEffect() to catch changes in cache*/
    /** This type of hack can lead to memory leaks if useEffect() is never called (no idea how it can happen) */
    const [initListener, setInitListener] = useState<undefined | CacheListener<Key, Value>>(() => {
      if (setOfKeys.size !== 0) {
        const listener = listenerF<Key, Value>(setOfKeys, setResult);
        cache.registerListener(listener);
        return listener;
      }
      return undefined;
    });

    useEffect(() => {
      if (initListener !== undefined) {
        cache.unregisterListener(initListener);
        setInitListener(undefined);
      }

      const listener = listenerF<Key, Value>(setOfKeys, setResult);
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    }, [initListener, setInitListener, setOfKeys, setResult]);

    useEffect(() => {
      for (const cacheKey of cacheKeys) {
        if (cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
          cache.queue(cacheKey);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache.memoryCacheStamp, setOfKeys]);

    return result;
  }

  return useCacheValues;
}
