import {assert} from 'chai';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import {testCache, TestCacheValueProvider, testLoader} from './testCache';

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class Wrapper<Result> extends React.PureComponent<{children: Result}> {
  override render () {
    console.debug('[Wrapper] is rendered for ', this.props.children);
    return this.props.children;
  }
}

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

});
