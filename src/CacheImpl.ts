import Cache, {CacheListener} from './Cache';
import ChainedDataLoader from './ChainedDataLoader';
import IndexDbLoader from './IndexDbLoader';

export interface CacheOptions<DbValue, Value> {
  loader: (cacheKey: string) => Promise<Value | undefined>;
  databaseName: string;
  cacheKeyPath: string & keyof DbValue;
  objectStoreName?: string;
  prepareForDb?: (value: Value) => DbValue;
  restoreAfterDb?: (dbValue: DbValue) => Value;
  onError?: (cacheKey: string, error: unknown) => unknown;
}

export default class CacheImpl<DbValue, Value>
implements Cache<Value> {

  private readonly dataLoader: ChainedDataLoader<string, Value>;

  private readonly onError?: (cacheKey: string, error: unknown) => unknown;

  public memoryCache: Record<string, Value> = {};
  public memoryCacheStamp = 0;

  private readonly listeners: Set<CacheListener<Value>> = new Set();

  public queued: Set<string> = new Set();
  public queuedStamp = 0;

  constructor (options: CacheOptions<DbValue, Value>) {
    const indexedDbLoader = new IndexDbLoader<string, DbValue, Value>(
      options.databaseName, options.cacheKeyPath, options);

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
    this.memoryCache = {};
    await this.dataLoader.clear();
  };

  invalidate = async (cacheKey: string) => {
    delete this.memoryCache[cacheKey];
    this.memoryCacheStamp++;
    await this.dataLoader.invalidate(cacheKey);
    this.onChange(cacheKey, undefined);
  };

  private readonly onChange = (cacheKey: string, value: Value | undefined) => {
    for (const listener of this.listeners) {
      listener(cacheKey, value);
    }
  };

  queue = (cacheKey: string) => this.queueImpl(this.dataLoader.get, cacheKey);

  private readonly queueImpl = async (
    method: (cacheKey: string) => Promise<Value | undefined>,
    cacheKey: string
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

  registerListener = (listener: CacheListener<Value>) => this.listeners.add(listener);

  requeue = (cacheKey: string) => this.queueImpl(this.dataLoader.requeue, cacheKey);

  unregisterListener = (listener: CacheListener<Value>) => this.listeners.delete(listener);

}
