import {useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

export default function cacheValuesHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) : ((cacheKeys: readonly Key[]) => Record<Key, Value>) {

  function useCacheValues (cacheKeys: readonly Key[]): Record<Key, Value> {
    const setOfKeys = useMemo(() => new Set<Key>(cacheKeys), [cacheKeys]);
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Key, Value> = cacheKey => {
        if (setOfKeys.has(cacheKey)) {
          setCounter(c => c + 1);
        }
      };
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    }, [setOfKeys]);

    useEffect(() => {
      for (const cacheKey of cacheKeys) {
        if (cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
          cache.queue(cacheKey);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache.memoryCacheStamp, cache.queuedStamp, setOfKeys]);

    return cache.memoryCache;
  }

  return useCacheValues;
}
