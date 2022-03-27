import {useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener} from './Cache';

export default function cacheValuesHookFactory<Value> (cache: Cache<Value>) : ((cacheKeys: readonly string[]) => Record<string, Value>) {

  function useCacheValues (cacheKeys: readonly string[]): Record<string, Value> {
    const setOfKeys = useMemo(() => new Set<string>(cacheKeys), [cacheKeys]);
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Value> = cacheKey => {
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
