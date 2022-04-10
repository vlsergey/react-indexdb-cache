import BaseCache from './BaseCache';
import ChainedDataLoader from './ChainedDataLoader';

export type ValidMemoryOnlyCacheKey = string | number | symbol;

export interface MemoryOnlyCacheOptions<Key extends ValidMemoryOnlyCacheKey, Value> {
  loader: (cacheKey: Key) => Promise<Value | undefined>;
  onError?: (cacheKey: Key, error: unknown) => unknown;
}

export default class MemoryOnlyCache<Key extends ValidMemoryOnlyCacheKey, Value>
  extends BaseCache<Key, Value> {

  private readonly dataLoader: ChainedDataLoader<Key, Value>;

  private readonly onError?: (cacheKey: Key, error: unknown) => unknown;

  public readonly queued: Set<Key> = new Set();
  public queuedStamp = 0;

  constructor (options: MemoryOnlyCacheOptions<Key, Value>) {
    super();
    this.dataLoader = new ChainedDataLoader(options.loader);
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
      this.putToMemoryCache(cacheKey, value);
    } catch (err) {
      this.onError?.(cacheKey, err);
    } finally {
      this.queued.delete(cacheKey);
      this.queuedStamp++;
    }
  };

  requeue = (cacheKey: Key) => this.queueImpl(this.dataLoader.requeue, cacheKey);

}
