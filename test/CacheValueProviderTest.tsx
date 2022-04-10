import {assert} from 'chai';
import React, {Dispatch, SetStateAction} from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import {testCache, TestCacheValueProvider, testLoader} from './testCache';
import TestValueHolder from './TestValueHolder';
import Wrapper from './Wrapper';

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CacheValueProvider', () => {

  beforeEach(async () => {
    await testCache.clear();
  });

  it('returns undefined until value is received', async () => {

    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestCacheValueProvider cacheKey="testKey">
        { (value: number | undefined) => <span className="value">{value || ''}</span> }
      </TestCacheValueProvider>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '');

    await testLoader.waitForResolveToBeRegistered('testKey');

    testLoader.queueResolve.testKey!(42);
    await sleep(0);

    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '42');

  });

  it('Calling putToMemoryCache will immediatly result in rerender', () => {
    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestCacheValueProvider cacheKey="testKey">
        { value => <span className="value">{value || ''}</span> }
      </TestCacheValueProvider>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '');

    testCache.putToMemoryCache('testKey', 42);

    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '42');
  });

  it('Calling putToMemoryCache will immediatly result in rerender, even if cacheKey is changed after hook first call', () => {
    let keyNameSetter: Dispatch<SetStateAction<string>>;

    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestValueHolder initialValue="testKey" setValueConsumer={(setter: Dispatch<SetStateAction<string>>) => {
        keyNameSetter = setter;
      }}>{ cacheKey =>
          <TestCacheValueProvider cacheKey={cacheKey}>
            { value => <span className="value">{value || ''}</span> }
          </TestCacheValueProvider>
        }</TestValueHolder>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '');

    testCache.putToMemoryCache('testKey', 42);
    testCache.putToMemoryCache('testKey2', 84);

    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '42');

    keyNameSetter!('testKey2');
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'value').textContent, '84');
  });

});
