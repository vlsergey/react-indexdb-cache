import Cache, {CacheListener, ValidCacheKey} from './Cache';

export default abstract class BaseCache<Key extends ValidCacheKey, Value>
implements Cache<Key, Value> {

  public memoryCache = {} as Record<Key, Value>;
  public memoryCacheStamp = 0;

  private readonly listeners: Set<CacheListener<Key, Value>> = new Set();

  protected readonly onChange = (cacheKey: Key, value: Value | undefined) => {
    for (const listener of this.listeners) {
      listener(cacheKey, value);
    }
  };

  putToMemoryCache = (cacheKey: Key, value: Value | undefined) => {
    if (value === undefined) {
      delete this.memoryCache[cacheKey];
    } else {
      this.memoryCache[cacheKey] = value;
    }
    this.memoryCacheStamp++;
    this.onChange(cacheKey, value);
  };

  registerListener = (listener: CacheListener<Key, Value>) => this.listeners.add(listener);

  unregisterListener = (listener: CacheListener<Key, Value>) => this.listeners.delete(listener);

  abstract clear: () => Promise<void>;
  abstract invalidate: (cacheKey: Key) => unknown;
  abstract queue: (cacheKey: Key) => unknown;
  abstract queued: Readonly<Set<Key>>;
  abstract queuedStamp: number;
  abstract requeue: (cacheKey: Key) => unknown;

}
