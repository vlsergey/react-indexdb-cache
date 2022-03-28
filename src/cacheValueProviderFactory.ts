import React from 'react';

import Cache, {ValidCacheKey} from './Cache';
import cacheValueHookFactory from './cacheValueHookFactory';

export interface CacheValueProviderProps<Key extends ValidCacheKey, Value, Result> {
  children: (value: (Value | undefined)) => Result;
  cacheKey: Key;
}

export default function cacheValueProviderFactory<Key extends ValidCacheKey, Value> (cache: Cache<Key, Value>) {
  const useCacheValue = cacheValueHookFactory(cache);

  function CacheValueProvider<Result> ({
    children, cacheKey,
  }: CacheValueProviderProps<Key, Value, Result>): Result & JSX.Element {
    const value = useCacheValue(cacheKey);
    return children(value) as unknown as (Result & JSX.Element);
  }

  return React.memo(CacheValueProvider) as typeof CacheValueProvider;
}
