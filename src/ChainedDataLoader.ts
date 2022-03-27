
export default class ChainedDataLoader<K, V> {

  private readonly currentClear?: () => Promise<void>;
  private readonly currentGet: (cacheKey: K) => Promise<V | undefined>;
  private readonly currentSet?: ((cacheKey: K, value: V | undefined) => unknown) | undefined;
  private readonly isGood: (cacheKey: K, value: V) => boolean;
  private readonly next?: ChainedDataLoader<K, V>;

  constructor (
    currentGet: (cacheKey: K) => Promise<V | undefined>,

    isGood?: (cacheKey: K, value: V) => boolean,
    currentClear?: (() => Promise<void>) | undefined,
    currentSet?: ((cacheKey: K, value: V | undefined) => unknown),
    next?: ChainedDataLoader<K, V> | undefined
  ) {
    this.currentClear = currentClear;
    this.currentGet = currentGet;
    this.currentSet = currentSet;
    this.isGood = isGood || (() => true);
    this.next = next;
  }

  clear = async () => {
    await this.currentClear?.();
    await this.next?.clear();
  };

  get = async (cacheKey: K): Promise<V | undefined> => {
    const fromCurrent = await this.currentGet(cacheKey);
    if (fromCurrent != undefined && this.isGood(cacheKey, fromCurrent)) {
      return fromCurrent;
    }

    if (this.next) {
      const fromNext = await this.next.get(cacheKey);
      if (fromNext != undefined && this.isGood(cacheKey, fromNext)) {
        this.currentSet?.(cacheKey, fromNext);
        return fromNext;
      }
    }

    return undefined;
  };

  invalidate = async (cacheKey: K) => {
    await this.currentSet?.(cacheKey, undefined);
    await this.next?.invalidate(cacheKey);
  };

  requeue = async (cacheKey: K): Promise<V | undefined> => {
    const obtainer = this.next ? this.next.requeue : this.currentGet;
    const value = await obtainer(cacheKey);
    if (this.currentSet) {
      this.currentSet(cacheKey, value);
    }
    return value;
  };
}
