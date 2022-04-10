import {PureComponent} from 'react';

export default class Wrapper<Result> extends PureComponent<{children: Result}> {
  override render () {
    console.debug('[Wrapper] is rendered for ', this.props.children);
    return this.props.children;
  }
}
