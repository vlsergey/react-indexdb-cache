import BaseCache from './BaseCache';
import {ValidCacheKey} from './Cache';
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
  onDbLoad?: (cacheKey: Key, dbValue: Value) => unknown;
  onError?: (cacheKey: Key, error: unknown) => unknown;
}

export default class CacheWithIndexedDb<
  Key extends ValidIndexedDbCacheKey,
  DbValue,
  Value
> extends BaseCache<Key, Value> {

  private readonly dataLoader: ChainedDataLoader<Key, Value>;

  private readonly onError?: (cacheKey: Key, error: unknown) => unknown;

  public readonly queued: Set<Key> = new Set();
  public queuedStamp = 0;

  constructor (options: CacheWithIndexedDbOptions<Key, DbValue, Value>) {
    super();

    const indexedDbLoader = new IndexedDbLoader<Key, DbValue, Value>(
      options.databaseName, options);

    const onDbLoad: ((cacheKey: Key, value: Value) => unknown) | undefined = options.onDbLoad;

    const getImpl = async (cacheKey: Key): Promise<Value | undefined> => {
      const result = (await indexedDbLoader.get(cacheKey)) as Value;
      onDbLoad?.(cacheKey, result);
      return result;
    };

    this.dataLoader = new ChainedDataLoader(
      getImpl,
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

  requeue = (cacheKey: Key) => this.queueImpl(this.dataLoader.requeue, cacheKey);

}
