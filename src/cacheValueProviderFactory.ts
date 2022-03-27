import React from 'react';

import Cache from './Cache';
import cacheValueHookFactory from './cacheValueHookFactory';

export interface CacheValueProviderProps<Value, Result> {
  children: (value: (Value | undefined)) => Result;
  cacheKey: string;
}

export default function cacheValueProviderFactory<Value> (cache: Cache<Value>) {
  const useCacheValue = cacheValueHookFactory(cache);

  function CacheValueProvider<Result> ({
    children, cacheKey,
  }: CacheValueProviderProps<Value, Result>): Result {
    const value = useCacheValue(cacheKey);
    return children(value);
  }

  return React.memo(CacheValueProvider) as typeof CacheValueProvider;
}
