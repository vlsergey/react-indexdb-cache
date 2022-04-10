import {Dispatch, SetStateAction, useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';

function listenerF<Key extends ValidCacheKey, Value> (
    cacheKeyToObserve: Set<Key>,
    setCounter: Dispatch<SetStateAction<number>>,
    debug?: boolean
): CacheListener<Key, Value> {
  return (cacheKeyOfChangedItem: Key, value: Value | undefined) => {
    if (debug) console.debug('[useCacheValue] [listenerF]', Array.from(cacheKeyToObserve), cacheKeyOfChangedItem, value);
    if (cacheKeyToObserve.has(cacheKeyOfChangedItem)) {
      if (debug) console.debug('[useCacheValue] [listenerF]', Array.from(cacheKeyToObserve), cacheKeyOfChangedItem, value, ' => increment counter');
      setCounter(counter => counter + 1);
    }
  };
}

export default function cacheValueHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>,
    debug?: boolean
) {

  function useCacheValue (cacheKey: Key | undefined): Value | undefined {
    if (debug) console.debug('[useCacheValue] cacheKey:', cacheKey);

    const [cacheKeyToObserve] = useState(new Set<Key>());
    const setCounter = useState(0)[1];

    if (cacheKey != undefined) {
      if (!cacheKeyToObserve.has(cacheKey)) {
        if (debug) console.debug('[useCacheValue] updating cacheKeyToObserve:', Array.from(cacheKeyToObserve), cacheKey);
        cacheKeyToObserve.clear();
        cacheKeyToObserve.add(cacheKey);
      }
    } else if (cacheKeyToObserve.size !== 0) {
      cacheKeyToObserve.clear();
    }

    if (debug) console.debug('[useCacheValue] cacheKeyToObserve:', Array.from(cacheKeyToObserve));

    /** we use temporary listener until first call of useEffect() to catch changes in cache*/
    /** This type of hack can lead to memory leaks if useEffect() is never called (no idea how it can happen) */
    const setInitListener = useState<undefined | CacheListener<Key, Value>>(() => {
      if (cacheKey !== undefined) {
        const listener = listenerF<Key, Value>(cacheKeyToObserve, setCounter, debug);
        if (debug) console.debug('[useCacheValue] register init listener');
        cache.registerListener(listener);
        return listener;
      }
      return undefined;
    })[1];

    useEffect(() => {
      setInitListener((prevInitListener?: CacheListener<Key, Value>) => {
        if (prevInitListener != undefined) {
          if (debug) console.debug('[useCacheValue] unregistering init listener');
          cache.unregisterListener(prevInitListener);
        }
        return undefined;
      });

      if (debug) console.debug('[useCacheValue] registering useEffect listener');
      const listener = listenerF<Key, Value>(cacheKeyToObserve, setCounter, debug);
      cache.registerListener(listener);
      return () => {
        if (debug) console.debug('[useCacheValue] unregistering useEffect listener');
        cache.unregisterListener(listener);
      };
    }, [cacheKeyToObserve, setCounter, setInitListener]);

    useEffect(() => {
      if (cacheKey !== undefined && cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
        cache.queue(cacheKey);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

    const result = useMemo(() =>
      cacheKey === undefined ? undefined : cache.memoryCache[cacheKey]
      // eslint-disable-next-line react-hooks/exhaustive-deps
    , [cacheKey, cache.memoryCacheStamp]);
    if (debug) console.debug('[useCacheValue] result', result);
    return result;
  }

  return useCacheValue;
}
