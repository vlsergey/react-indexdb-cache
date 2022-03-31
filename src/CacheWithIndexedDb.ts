import Cache, {CacheListener, ValidCacheKey} from './Cache';
import ChainedDataLoader from './ChainedDataLoader';
import IndexedDbLoader from './IndexedDbLoader';

export type ValidIndexedDbCacheKey = IDBValidKey & ValidCacheKey;

export interface CacheWithIndexedDbOptions<
  Key extends ValidIndexedDbCacheKey,
  DbValue,
  Value
> {
  loader: (cacheKey: Key) => Promise<Value | undefined>;
  databaseName: string;
  objectStoreName?: string;
  prepareForDb?: (value: Value) => DbValue;
  restoreAfterDb?: (dbValue: DbValue) => Value;
  onError?: (cacheKey: Key, error: unknown) => unknown;
}

export default class CacheWithIndexedDb<
  Key extends ValidIndexedDbCacheKey,
  DbValue,
  Value
> implements Cache<Key, Value> {

  private readonly dataLoader: ChainedDataLoader<Key, Value>;

  private readonly onError?: (cacheKey: Key, error: unknown) => unknown;

  public memoryCache = {} as Record<Key, Value>;
  public memoryCacheStamp = 0;

  private readonly listeners: Set<CacheListener<Key, Value>> = new Set();

  public readonly queued: Set<Key> = new Set();
  public queuedStamp = 0;

  constructor (options: CacheWithIndexedDbOptions<Key, DbValue, Value>) {
    const indexedDbLoader = new IndexedDbLoader<Key, DbValue, Value>(
      options.databaseName, options);

    this.dataLoader = new ChainedDataLoader(
      indexedDbLoader.get,
      undefined,
      indexedDbLoader.clear,
      indexedDbLoader.store,
      new ChainedDataLoader(options.loader)
    );

    this.onError = options.onError;
  }

  clear = async () => {
    this.memoryCache = {} as Record<Key, Value>;
    await this.dataLoader.clear();
  };

  invalidate = async (cacheKey: Key) => {
    delete this.memoryCache[cacheKey];
    this.memoryCacheStamp++;
    await this.dataLoader.invalidate(cacheKey);
    this.onChange(cacheKey, undefined);
  };

  private readonly onChange = (cacheKey: Key, value: Value | undefined) => {
    for (const listener of this.listeners) {
      listener(cacheKey, value);
    }
  };

  queue = (cacheKey: Key) => this.queueImpl(this.dataLoader.get, cacheKey);

  private readonly queueImpl = async (
    method: (cacheKey: Key) => Promise<Value | undefined>,
    cacheKey: Key
  ) => {

    if (this.queued.has(cacheKey)) {
      return;
    }

    this.queued.add(cacheKey);
    this.queuedStamp++;
    try {
      const value = await method(cacheKey);

      if (value === undefined) {
        delete this.memoryCache[cacheKey];
      } else {
        this.memoryCache[cacheKey] = value;
      }
      this.memoryCacheStamp++;
      this.onChange(cacheKey, value);
    } catch (err) {
      this.onError?.(cacheKey, err);
    } finally {
      this.queued.delete(cacheKey);
      this.queuedStamp++;
    }
  };

  registerListener = (listener: CacheListener<Key, Value>) => this.listeners.add(listener);

  requeue = (cacheKey: Key) => this.queueImpl(this.dataLoader.requeue, cacheKey);

  unregisterListener = (listener: CacheListener<Key, Value>) => this.listeners.delete(listener);

}
