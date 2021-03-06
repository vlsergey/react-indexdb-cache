import {OutOfLineKeyIndexedDbRepository, OutOfLineKeyIndexedDbRepositoryImpl} from '@vlsergey/react-indexdb-repo';

// @ts-expect-error cheap support for some old versions of IndexedDb
const indexedDB: IDBFactory = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

interface IndexedDbLoaderOptions<DbValue, Value> {
  objectStoreName?: string;
  prepareForDb?: (value: Value) => DbValue;
  restoreAfterDb?: (dbValue: DbValue) => Value;
}

export default class IndexedDbLoader<
  Key extends IDBValidKey,
  DbValue,
  Value
> {

  private readonly repoPromise: Promise<OutOfLineKeyIndexedDbRepository<Key, Value> | null>;

  constructor (databaseName: string, {
    prepareForDb = (value: Value) => value as unknown as DbValue,
    restoreAfterDb = (flatValue: DbValue) => flatValue as unknown as Value,
    objectStoreName = 'CACHE',
  }: IndexedDbLoaderOptions<DbValue, Value>) {

    this.repoPromise = new Promise((resolve, reject) => {
      if (indexedDB) {
        const dbOpenRequest = indexedDB.open(databaseName, 1);
        dbOpenRequest.onerror = err => {
          console.warn(`Unable to open indexedDB for database '${databaseName}'`);
          console.warn(err);
          reject(err);
        };
        dbOpenRequest.onsuccess = () => {
          console.debug(`Successfully open indexedDB connection for database '${databaseName}'`);

          const repo = new OutOfLineKeyIndexedDbRepositoryImpl<Key, DbValue, Value>(dbOpenRequest.result, objectStoreName);
          repo.transformAfterIndexDb = restoreAfterDb;
          repo.transformBeforeIndexDb = prepareForDb;
          resolve(repo);
        };
        dbOpenRequest.onupgradeneeded = () => {
          const db = dbOpenRequest.result;
          db.createObjectStore(objectStoreName);
        };
      } else {
        resolve(null);
      }
    });
  }

  clear = async (): Promise<void> => {
    const repo = await this.repoPromise;
    if (!repo) return undefined;
    await repo.deleteAll();
  };

  get = async (cacheKey: Key): Promise<Value | undefined> => {
    const repo = await this.repoPromise;
    if (!repo) return undefined;
    return await repo?.findById(cacheKey);
  };

  invalidate = async (cacheKey: Key): Promise<void> => {
    const repo = await this.repoPromise;
    if (!repo) return;
    await repo?.deleteById(cacheKey);
  };

  store = async (cacheKey: Key, value: Value | undefined): Promise<void> => {
    const repo = await this.repoPromise;
    if (!repo) return;
    if (value === undefined) {
      await repo?.deleteById(cacheKey);
    } else {
      await repo.save(cacheKey, value);
    }
  };

}
