import {useEffect, useMemo, useState} from 'react';

import Cache, {CacheListener} from './Cache';

export default function useCacheValuesFactory<Value> (cache: Cache<Value>) : ((keys: string[]) => Record<string, Value>) {

  function useCacheValues (keys: string[]): Record<string, Value> {
    const setOfKeys = useMemo(() => new Set<string>(keys), [keys]);
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Value> = key => {
        if (setOfKeys.has(key)) {
          setCounter(c => c + 1);
        }
      };
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    });

    return cache.memoryCache;
  }

  return useCacheValues;
}
