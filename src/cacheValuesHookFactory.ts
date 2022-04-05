import {useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

export default function cacheValuesHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) : ((cacheKeys: readonly Key[]) => Record<Key, Value>) {

  function useCacheValues (cacheKeys: readonly Key[]): Record<Key, Value> {
    const setOfKeys = useMemo(() => new Set<Key>(cacheKeys), [cacheKeys]);
    const [result, setResult] = useState<Record<Key, Value>>(() => {
      const initial = {} as Record<Key, Value>;
      for (const key of cacheKeys) {
        const value = cache.memoryCache[key];
        if (value !== undefined) {
          initial[key] = value;
        }
      }
      return initial;
    });

    useEffect(() => {
      const listener: CacheListener<Key, Value> = (cacheKey, value) => {
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
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    }, [setOfKeys, setResult]);

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
