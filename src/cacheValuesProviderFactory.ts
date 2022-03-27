import React from 'react';

import Cache from './Cache';
import cacheValuesHookFactory from './cacheValuesHookFactory';

export interface CacheValuesProviderProps<Value, Result> {
  children: (values: Record<string, Value>) => Result;
  cacheKeys: readonly string[];
}

export default function cacheValueProviderFactory<Value> (cache: Cache<Value>) {
  const useCacheValues = cacheValuesHookFactory(cache);

  function CacheValuesProvider<Result> ({
    children, cacheKeys,
  }: CacheValuesProviderProps<Value, Result>): Result {
    const values = useCacheValues(cacheKeys);
    return children(values);
  }

  return React.memo(CacheValuesProvider) as typeof CacheValuesProvider;
}
