import {cacheValueProviderFactory,
  cacheValuesProviderFactory, CacheWithIndexedDb} from '../src/index';

class TestLoader {

  queue = (key: string) => new Promise<number | undefined>(resolve => {
    console.debug('[TestLoader] registering resolve for key', key);
    this.queueResolve[key] = resolve;

    console.debug('[TestLoader] Resolving queueChangePromise');
    this.queueChangePromiseResolve!(key);
    this.queueChangePromise = new Promise(resolve => {
      console.debug('[TestLoader] New Promise for queueChangePromise');
      this.queueChangePromiseResolve = resolve;
    });
  });

  queueChangePromise = new Promise(resolve => {
    console.debug('[TestLoader] New Promise for queueChangePromise');
    this.queueChangePromiseResolve = resolve;
  });

  private queueChangePromiseResolve?: (value: unknown) => void;

  queueResolve: Record<string, (value: number | undefined | PromiseLike<number | undefined>) => void> = {};

  waitForResolveToBeRegistered = async (...keys: string[]) => {
    while (keys.some(key => this.queueResolve[key] === undefined)) {
      console.debug('[TestLoader] Known resolve keys:', Object.keys(this.queueResolve));
      await this.queueChangePromise;
    }
    console.debug('[TestLoader] Known resolve keys:', Object.keys(this.queueResolve));
  };

}

const testLoader = new TestLoader();

const testCache = new CacheWithIndexedDb<string, number, number>({
  loader: (cacheKey: string) => {
    console.debug(`[testCache] invoked loader for key '${cacheKey}'`);
    return testLoader.queue(cacheKey);
  },
  databaseName: 'testDatabase',
});

const TestCacheValueProvider = cacheValueProviderFactory(testCache);
const TestCacheValuesProvider = cacheValuesProviderFactory(testCache);

export {
  testCache,
  testLoader,
  TestLoader,
  TestCacheValueProvider,
  TestCacheValuesProvider,
};
