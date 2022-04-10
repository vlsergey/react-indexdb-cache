# react-indexdb-cache

Flexible indexeddb-backed cache for react application

* Uses [IndexedDb](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) to store cached data, thus it can be used even if user reloads page or reopen browser window.
* Tries to reduce number of component render calls as much as possible. For example changing key order in arguments from `['first', 'second']` to `['second', 'first']` will return same `Record<string,...>` object instance. Thus it's safe to use cache result as `useMemo` or `React.memo` argument.

[![NPM version][npm-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Downloads][downloads-image]][downloads-url]

## Usage

### Cache definition
Create new file and define loader, cache instance and access helpers (hooks and components):

```TypeScript
import {cacheValueProviderFactory, cacheValuesProviderFactory, CacheWithIndexedDb,
  cacheValueHookFactory, cacheValuesHookFactory} from '@vlsergey/react-indexdb-cache';

type Key = string;
type Value = number;

async function loader(key : Key) : Promise<Value | undefined> {
  // place actual key to value resolving here
  return 42;
}

export const cache = new CacheWithIndexedDb<string, number, number>({
  loader,
  databaseName: 'testDatabase', // name of IndexedDb database name
});

export const CacheValueProvider = cacheValueProviderFactory(testCache, true);
export const CacheValuesProvider = cacheValuesProviderFactory(testCache);
export const useCacheValue = cacheValueHookFactory(propertiesDataCache);
export const useCacheValues = cacheValuesHookFactory(propertiesDataCache);

export default cache
```

It is advised to use batching function (like one from `@vlsergey/batcher`) to group multiple async calls into batches.

```TypeScript
import Batcher from '@vlsergey/batcher';

async function batchLoader(keys : Key[]) : Promise<(Value | undefined)[]> {
  // place actual key to value resolving here
  return keys.map( key => 42 );
}

const batcher = new Batcher<string, number>(batchLoader, {
  maxBatchSize: 50
});

export const cache = new CacheWithIndexedDb<string, number, number>({
  loader: key => batcher.queue(key),
  databaseName: 'testDatabase', // name of IndexedDb database name
});

```

### Cache usage
Use cache values in functional of class components.

```TypeScript
import {CacheValueProvider, CacheValuesProvider, useCacheValue, useCacheValues} from "./myCache.ts"
```

```TypeScript
interface MyComponentProps {
  entityId?: string
}

function MyComponent({
  entityId
} : MyComponentProps) => {
  const valueFromCache : number | undefined = useCacheValue( entityId );
  return valueFromCache ? <span>{valueFromCache}</span> : <span>Loading...</span>
}
```

```TypeScript
interface MyComponentProps {
  entityId?: string
}

function MyComponent({
  entityId
} : MyComponentProps) => <CacheValueProvider cacheKey={entityId}>{ (valueFromCache : number | undefined) =>
  valueFromCache ? <span>{valueFromCache}</span> : <span>Loading...</span>
}</CacheValueProvider>
```

```TypeScript
interface MyComponentProps {
  entityIds: readonly string[]
}

function MyComponent({
  entityIds
} : MyComponentProps) => {
  const valuesFromCache : Record<string, number> = useCacheValues( entityIds );
  return JSON.stringify(valuesFromCache)
}
```

```TypeScript
interface MyComponentProps {
  entityIds: readonly string[]
}

function MyComponent({
  entityIds
} : MyComponentProps) => <CacheValuesProvider cacheKeys={entityIds}>{ (valuesFromCache : Record<string, number>) =>
  valueFromCache ? <span>{valueFromCache}</span> : <span>Loading...</span>
}</CacheValuesProvider>
```

[npm-image]: https://img.shields.io/npm/v/@vlsergey/react-indexdb-cache.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@vlsergey/react-indexdb-cache
[ci-image]: https://github.com/vlsergey/react-indexdb-cache/actions/workflows/node.js.yml/badge.svg
[ci-url]: https://github.com/vlsergey/react-indexdb-cache/actions/workflows/node.js.yml
[downloads-image]: http://img.shields.io/npm/dm/@vlsergey/react-indexdb-cache.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/@vlsergey/react-indexdb-cache
