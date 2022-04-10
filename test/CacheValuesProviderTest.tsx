import {assert} from 'chai';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import {testCache, TestCacheValuesProvider, testLoader} from './testCache';

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class Wrapper<Result> extends React.PureComponent<{children: Result}> {
  override render () {
    console.debug('[Wrapper] is rendered for ', this.props.children);
    return this.props.children;
  }
}

describe('CacheValuesProvider', () => {

  beforeEach(async () => {
    await testCache.clear();
  });

  it('Can be compiled with array result (from map function)', () => {
    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestCacheValuesProvider cacheKeys={cacheKeys}>
        { (values: Record<string, number>) => Object.entries(values).map(([key, value]) =>
          <span key={key}><span>{key}</span><span>{value || ''}</span></span>
        ) }
      </TestCacheValuesProvider>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);
  });

  const cacheKeys = ['first', 'second'] as const;
  it('returns undefined until value is received', async () => {

    const rendered = ReactTestUtils.renderIntoDocument<Wrapper<unknown>>(<Wrapper>
      <TestCacheValuesProvider cacheKeys={cacheKeys}>
        { (values: Record<string, number>) => <>
          <span className="valueFirst">{values.first || ''}</span>
          <span className="valueSecond">{values.second || ''}</span>
        </> }
      </TestCacheValuesProvider>
    </Wrapper>) as Wrapper<unknown>;
    assert.ok(rendered);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueFirst').textContent, '');
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueSecond').textContent, '');

    await testLoader.waitForResolveToBeRegistered('first', 'second');

    testLoader.queueResolve.first!(42);
    await sleep(0);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueFirst').textContent, '42');
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueSecond').textContent, '');

    testLoader.queueResolve.second!(84);
    await sleep(0);
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueFirst').textContent, '42');
    assert.equal(ReactTestUtils.findRenderedDOMComponentWithClass(rendered, 'valueSecond').textContent, '84');

  });

});
