import React from 'react';

import Cache from './Cache';
import useCacheValueFactory from './useCacheValueFactory';

interface Props<Value, Result> {
  children: (value: (Value | undefined)) => Result;
  key: string;
}

export default function CacheValueProviderFactory<Value> (cache: Cache<Value>) {
  const useCacheValue = useCacheValueFactory(cache);

  function CacheValueProvider<Result> ({
    children, key,
  }: Props<Value, Result>): Result {
    const value = useCacheValue(key);
    return children(value);
  }

  return React.memo(CacheValueProvider);
}
