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

    getPrice: PropTypes.func,

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
    this.delivered_ref = false;

    this.contextValue = {
      braintree_api: this.api
    }
  }

  componentWillUnmount() {
    this.api.teardown();
  }

  componentDidUpdate() {
    if(this.props.ready){
      this.api.setAuthorization(this.props.authorization, this.props.onAuthorizationSuccess);

      if (this.props.getBraintreeApiRef && !this.delivered_ref) {
        this.props.getBraintreeApiRef(this.api);
        this.delivered_ref = true;
      }
    }
  }

  tokenize(options) {
    return this.api.tokenize(options);
  }

  render() {
    if(!this.props.ready){
      return;
    }

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
