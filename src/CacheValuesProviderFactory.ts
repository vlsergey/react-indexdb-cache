import React from 'react';

import Cache from './Cache';
import useCacheValuesFactory from './useCacheValuesFactory';

interface Props<Value, Result> {
  children: (values: Record<string, Value>) => Result;
  keys: string[];
}

export default function CacheValueProviderFactory<Value> (cache: Cache<Value>) {
  const useCacheValues = useCacheValuesFactory(cache);

  function CacheValuesProvider<Result> ({
    children, keys,
  }: Props<Value, Result>): Result {
    const values = useCacheValues(keys);
    return children(values);
  }

  return React.memo(CacheValuesProvider);
}
