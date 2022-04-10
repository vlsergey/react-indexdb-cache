import {Dispatch, SetStateAction, useEffect, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

function listenerF<Key extends ValidCacheKey, Value> (
    cacheKeyToCheck: Key | undefined,
    setValue: Dispatch<SetStateAction<Value | undefined>>
): CacheListener<Key, Value> {
  return (cacheKeyOfChangedItem: Key, value: Value | undefined) => {
    if (cacheKeyToCheck === cacheKeyOfChangedItem) {
      setValue(value);
    }
  };
}

export default function cacheValueHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) {

  function useCacheValue (cacheKey: Key | undefined): Value | undefined {
    const [value, setValue] = useState<Value | undefined>(cacheKey !== undefined ? cache.memoryCache[cacheKey] : undefined);

    /** we use temporary listener until first call of useEffect() to catch changes in cache*/
    /** This type of hack can lead to memory leaks if useEffect() is never called (no idea how it can happen) */
    const [initListener, setInitListener] = useState<undefined | CacheListener<Key, Value>>(() => {
      if (cacheKey !== undefined) {
        const listener = listenerF<Key, Value>(cacheKey, setValue);
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
      const listener = listenerF<Key, Value>(cacheKey, setValue);
      cache.registerListener(listener);
      return () => {
        cache.unregisterListener(listener);
      };
    }, [cacheKey, initListener, setInitListener]);

    useEffect(() => {
      if (cacheKey !== undefined && cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
        cache.queue(cacheKey);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

    console.debug('useCacheValue', cacheKey, value, cacheKey !== undefined ? cache.memoryCache[cacheKey] : undefined);
    return value;
  }

  return useCacheValue;
}
