
export default class ChainedDataLoader<K, V> {

  private readonly currentGet: (key: K) => Promise<V | undefined>;
  private readonly currentSet?: ((key: K, value: V | undefined) => unknown) | undefined;
  private readonly isGood: (key: K, value: V) => boolean;
  private readonly next?: ChainedDataLoader<K, V>;

  constructor (
    currentGet: (key: K) => Promise<V | undefined>,
    currentSet: ((key: K, value: V | undefined) => unknown) | undefined = undefined,
    next: ChainedDataLoader<K, V> | undefined = undefined,
    isGood: (key: K, value: V) => boolean = () => true
  ) {
    this.currentGet = currentGet;
    this.currentSet = currentSet;
    this.isGood = isGood;
    this.next = next;
  }

  get = async (key: K): Promise<V | undefined> => {
    const fromCurrent = await this.currentGet(key);
    if (fromCurrent != undefined && this.isGood(key, fromCurrent)) {
      return fromCurrent;
    }

    if (this.next) {
      const fromNext = await this.next.get(key);
      if (fromNext != undefined && this.isGood(key, fromNext)) {
        this.currentSet?.(key, fromNext);
        return fromNext;
      }
    }

    return undefined;
  };

  invalidate = async (key: K) => {
    await this.currentSet?.(key, undefined);
    await this.next?.invalidate(key);
  };

  requeue = async (key: K): Promise<V | undefined> => {
    const obtainer = this.next ? this.next.requeue : this.currentGet;
    const value = await obtainer(key);
    if (this.currentSet) {
      this.currentSet(key, value);
    }
    return value;
  };
}
