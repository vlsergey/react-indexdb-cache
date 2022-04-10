import React, {Dispatch, SetStateAction, useState} from 'react';

interface Props<T, R> {
  children: (value: T) => R;
  initialValue: T;
  setValueConsumer: (valueSetter: Dispatch<SetStateAction<T>>) => unknown;
}

const TestValueHolder = <T, R>({
  children,
  initialValue,
  setValueConsumer,
}: Props<T, R>) => {
  const [value, setValue] = useState<T>(initialValue);
  console.debug('[TestValueHolder]', initialValue, value);

  setValueConsumer(setValue);
  return children(value);
};

export default React.memo(TestValueHolder) as typeof TestValueHolder;
