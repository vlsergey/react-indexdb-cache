import Cache, {CacheListener} from './Cache';
import ChainedDataLoader from './ChainedDataLoader';
import IndexDbLoader from './IndexDbLoader';

export interface CacheOptions<DbValue, Value> {
  loader: (key: string) => Promise<Value | undefined>;
  databaseName: string;
  keyPath: string & keyof DbValue;
  objectStoreName?: string;
  prepareForDb?: (value: Value) => DbValue;
  restoreAfterDb?: (dbValue: DbValue) => Value;
  onError?: (key: string, error: unknown) => unknown;
}

export default class CacheImpl<DbValue, Value>
implements Cache<Value> {

  private readonly dataLoader: ChainedDataLoader<string, Value>;

  private readonly onError?: (key: string, error: unknown) => unknown;

  public memoryCache: Record<string, Value> = {};

  private readonly listeners: Set<CacheListener<Value>> = new Set();

  constructor (options: CacheOptions<DbValue, Value>) {
    const indexDbLoader = new IndexDbLoader<string, DbValue, Value>(
      options.databaseName, options.keyPath, options);

    this.dataLoader = new ChainedDataLoader(
      indexDbLoader.get, indexDbLoader.store,
      new ChainedDataLoader(options.loader)
    );

    this.onError = options.onError;
  }

  invalidate = async (key: string) => {
    delete this.memoryCache[key];
    await this.dataLoader.invalidate(key);
    this.onChange(key, undefined);
  };

  private readonly onChange = (key: string, value: Value | undefined) => {
    for (const listener of this.listeners) {
      listener(key, value);
    }
  };

  queue = (key: string) => this.queueImpl(this.dataLoader.get, key);

  private readonly queueImpl = async (
    method: (key: string) => Promise<Value | undefined>,
    key: string
  ) => {
    const value = await method(key);
    try {
      if (value === undefined) {
        delete this.memoryCache[key];
      } else {
        this.memoryCache[key] = value;
      }
      this.onChange(key, value);
    } catch (err) {
      this.onError?.(key, err);
    }
  };

  registerListener = (listener: CacheListener<Value>) => this.listeners.add(listener);

  requeue = (key: string) => this.queueImpl(this.dataLoader.requeue, key);

  unregisterListener = (listener: CacheListener<Value>) => this.listeners.delete(listener);

}
