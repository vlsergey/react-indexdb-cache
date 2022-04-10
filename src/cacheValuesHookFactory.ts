import {Dispatch, SetStateAction, useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener, ValidCacheKey} from './Cache';
import useDistinctAndSorted from './useDistinctAndSorted';
import usePreviousIfShallowEqual from './usePreviousIfShallowEqual';

function listenerF<Key extends ValidCacheKey, Value> (
    setOfKeys: Set<Key>,
    setCounter: Dispatch<SetStateAction<number>>
): CacheListener<Key, Value> {
  return (cacheKey: Key) => {
    if (setOfKeys.has(cacheKey)) {
      setCounter(counter => counter + 1);
    }
  };
}

export default function cacheValuesHookFactory<Key extends ValidCacheKey, Value> (
    cache: Cache<Key, Value>
) : ((cacheKeys: readonly Key[]) => Record<Key, Value>) {

  function useCacheValues (cacheKeys: readonly Key[]): Record<Key, Value> {
    const cachedCacheKeys = useDistinctAndSorted(cacheKeys);
    const setOfKeys = useMemo(() => new Set<Key>(cachedCacheKeys), [cachedCacheKeys]);

    const setCounter = useState(0)[1];

    /** we use temporary listener until first call of useEffect() to catch changes in cache*/
    /** This type of hack can lead to memory leaks if useEffect() is never called (no idea how it can happen) */
    const [initListener, setInitListener] = useState<undefined | CacheListener<Key, Value>>(() => {
      if (setOfKeys.size !== 0) {
        const listener = listenerF<Key, Value>(setOfKeys, setCounter);
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

      const listener = listenerF<Key, Value>(setOfKeys, setCounter);
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    }, [initListener, setInitListener, setOfKeys, setCounter]);

    useEffect(() => {
      for (const cacheKey of setOfKeys) {
        if (cache.memoryCache[cacheKey] === undefined && !cache.queued.has(cacheKey)) {
          cache.queue(cacheKey);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cache.memoryCacheStamp, setOfKeys]);

    const values = useMemo(() =>
      cachedCacheKeys.map(cacheKey => cache.memoryCache[cacheKey])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    , [cachedCacheKeys, cache.memoryCacheStamp]);

    const cachedValues = usePreviousIfShallowEqual(values);

    const result = useMemo(() => {
      const result: Record<Key, Value> = {} as Record<Key, Value>;
      for (let i = 0; i < cachedCacheKeys.length; i++) {
        const cacheKey = cachedCacheKeys[i];
        const value = cachedValues[i];
        if (cacheKey != undefined && value != undefined) {
          result[cacheKey] = value;
        }
      }
      return result;
    }, [cachedCacheKeys, cachedValues]);

    return result;
  }

  return useCacheValues;
}
