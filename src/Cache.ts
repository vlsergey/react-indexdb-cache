
export type CacheListener<Value> = (key: string, value: Value | undefined) => unknown;

export default interface Cache< Value> {

  memoryCache: Record<string, Value>;

  invalidate: (key: string) => unknown;

  queue: (key: string) => unknown;

  registerListener: (listener: CacheListener<Value>) => unknown;

  requeue: (key: string) => unknown;

  unregisterListener: (listener: CacheListener<Value>) => unknown;

}
