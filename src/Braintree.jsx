import React from 'react';
import PropTypes from 'prop-types';
import Api from './BraintreeClientApi';
import { Context } from './Context'

export default class Braintree extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,

    onAuthorizationSuccess: PropTypes.func,
    authorization: PropTypes.string,

    getBraintreeApiRef: PropTypes.func,

    onPaymentMethodReady: PropTypes.func,

    onDeviceData: PropTypes.func,
    onPaymentData: PropTypes.func,
    
    onValidityChange: PropTypes.func,
    onCardTypeChange: PropTypes.func,
    onError: PropTypes.func,

    styles: PropTypes.object,
    className: PropTypes.string,
    tagName: PropTypes.string,
  }

  static defaultProps = {
    tagName: 'div',
  }

  constructor(props) {
    super(props);

    this.api = new Api(props);

    this.contextValue = {
      braintree_api: this.api
    }
  }

  componentDidMount() {
    this.api.setAuthorization(this.props.authorization, this.props.onAuthorizationSuccess);

    if (this.props.getBraintreeApiRef) {
      this.props.getBraintreeApiRef(this.api);
    }
  }

  componentWillUnmount() {
    this.api.teardown();
  }

  componentDidUpdate() {
    this.api.setAuthorization(this.props.authorization, this.props.onAuthorizationSuccess);
  }

  tokenize(options) {
    return this.api.tokenize(options);
  }

  render() {
    const {
      className: providedClass,
      tagName: Tag
    } = this.props;

    let className = 'braintree-hosted-fields-wrapper';
    if (providedClass) {
      className += ` ${providedClass}`;
    }

    return (
      <Context.Provider value={ this.contextValue }>
        <Tag className={ className }>{ this.props.children }</Tag>
      </Context.Provider>
    );
  }

}
