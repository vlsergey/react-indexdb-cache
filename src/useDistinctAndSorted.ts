import {useMemo} from 'react';

import usePreviousIfShallowEqual from './usePreviousIfShallowEqual';

export default function useDistinctAndSorted<T> (values: readonly T[]): readonly T[] {
  const cached = usePreviousIfShallowEqual(values);

  const sorted = useMemo(() => {
    const result = Array.from(new Set(cached));
    result.sort();
    return result;
  }, [cached]);

  return usePreviousIfShallowEqual(sorted);
}
