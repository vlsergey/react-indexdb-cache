import React from 'react';

import Cache, {ValidCacheKey} from './Cache';
import cacheValuesHookFactory from './cacheValuesHookFactory';

export interface CacheValuesProviderProps<Key extends ValidCacheKey, Value, Result> {
  children: (values: Record<Key, Value>) => Result;
  cacheKeys: readonly Key[];
}

export default function cacheValueProviderFactory<Key extends ValidCacheKey, Value> (cache: Cache<Key, Value>) {
  const useCacheValues = cacheValuesHookFactory(cache);

  function CacheValuesProvider<Result> ({
    children, cacheKeys,
  }: CacheValuesProviderProps<Key, Value, Result>): Result & JSX.Element {
    const values = useCacheValues(cacheKeys);
    return children(values) as unknown as (Result & JSX.Element);
  }

  return React.memo(CacheValuesProvider) as typeof CacheValuesProvider;
}
