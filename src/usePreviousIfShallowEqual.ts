import {useRef} from 'react';

export default function usePreviousIfShallowEqual<T> (values: readonly T[]): readonly T[] {
  const prevInput = useRef<readonly T[]>(values);
  if (!shallowCompare(prevInput.current, values)) {
    prevInput.current = values;
  }
  return prevInput.current;
}

function shallowCompare<T> (a: readonly T[], b: readonly T[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
