import {assert} from 'chai';
import React, {Dispatch, SetStateAction} from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import {testCache, TestCacheValuesProvider} from './testCache';
import TestValueHolder from './TestValueHolder';
import Wrapper from './Wrapper';

describe('CacheValueProvider', () => {

  beforeEach(async () => {
    await testCache.clear();
  });

  it('Correcly handle changed number of keys', () => {

    testCache.putToMemoryCache('first', 42);
    testCache.putToMemoryCache('second', 84);

    let cacheKeysSetter: Dispatch<SetStateAction<string[]>>;

    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestValueHolder initialValue={['first']} setValueConsumer={(setter: Dispatch<SetStateAction<string[]>>) => {
        cacheKeysSetter = setter;
      }}>{ cacheKeys =>
          <TestCacheValuesProvider cacheKeys={cacheKeys}>
            { values => <span className="values">{JSON.stringify(values)}</span> }
          </TestCacheValuesProvider>
        }</TestValueHolder>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);

    assert.containsAllKeys(JSON.parse(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'values').textContent || ''), ['first']);

    cacheKeysSetter!(['first', 'second']);
    assert.containsAllKeys(JSON.parse(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'values').textContent || ''), ['first', 'second']);
  });

  it('Returns same result for shallow-same cache keys array', () => {

    testCache.putToMemoryCache('first', 42);
    testCache.putToMemoryCache('second', 84);

    interface CacheOutRecord {
      cacheKeys: string[];
      values: Record<string, number>;
    }
    const keysAndResults: CacheOutRecord[] = [];

    let cacheKeysSetter: Dispatch<SetStateAction<string[]>>;

    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestValueHolder initialValue={['first', 'second']} setValueConsumer={(setter: Dispatch<SetStateAction<string[]>>) => {
        cacheKeysSetter = setter;
      }}>{ cacheKeys =>
          <TestCacheValuesProvider cacheKeys={cacheKeys}>
            { values => {
              keysAndResults.push({cacheKeys, values});
              return <span className="values">{JSON.stringify(values)}</span>;
            } }
          </TestCacheValuesProvider>
        }</TestValueHolder>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);

    cacheKeysSetter!(['first', 'second']);
    cacheKeysSetter!(['second', 'first']);

    assert.equal(3, keysAndResults.length);
    assert.isTrue(keysAndResults[0]!.values === keysAndResults[1]!.values);
    assert.isTrue(keysAndResults[1]!.values === keysAndResults[2]!.values);
  });
});
