import {useEffect, useState} from 'react';

import Cache, {CacheListener} from './Cache';

export default function useCacheValueFactory<Value> (cache: Cache<Value>) : ((key: string) => Value | undefined) {

  function useCacheValue (key: string): Value | undefined {
    const [, setCounter] = useState<number>(0);

    useEffect(() => {
      const listener: CacheListener<Value> = keyOfChangedItem => {
        if (key === keyOfChangedItem) {
          setCounter(c => c + 1);
        }
      };
      cache.registerListener(listener);
      return () => { cache.unregisterListener(listener); };
    });

    return cache.memoryCache[key];
  }

  return useCacheValue;
}
