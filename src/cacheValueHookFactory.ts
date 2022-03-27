import {useEffect, useState} from 'react';

import Cache, {CacheListener} from './Cache';

export default function cacheValueHookFactory<Value> (cache: Cache<Value>) : ((cacheKey: string) => Value | undefined) {

  function useCacheValue (cacheKey: string): Value | undefined {
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Value> = cacheKeyOfChangedItem => {
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
      if (cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
        cache.queue(cacheKey);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache.memoryCacheStamp, cache.queuedStamp, cacheKey]);

    return cache.memoryCache[cacheKey];
  }

  return useCacheValue;
}
