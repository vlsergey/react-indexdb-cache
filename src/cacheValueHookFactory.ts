import {useEffect, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

export default function cacheValueHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) {

  function useCacheValue (cacheKey: Key | undefined): Value | undefined {
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Key, Value> = cacheKeyOfChangedItem => {
        if (cacheKey === cacheKeyOfChangedItem) {
          setCounter(c => c + 1);
        }
      };
      cache.registerListener(listener);
      return () => {
        cache.unregisterListener(listener);
      };
    });

    useEffect(() => {
      if (cacheKey !== undefined && cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
        cache.queue(cacheKey);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache.memoryCacheStamp, cache.queuedStamp, cacheKey]);

    return cacheKey !== undefined ? cache.memoryCache[cacheKey] : undefined;
  }

  return useCacheValue;
}
