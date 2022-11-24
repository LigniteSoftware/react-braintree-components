import React from 'react';
import PropTypes from 'prop-types';
import { Context } from './context'

export default class BraintreeHostedField extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf([
      'number', 'expirationDate', 'expirationMonth', 'expirationYear', 'cvv', 'postalCode', 'cardholderName',
    ]).isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    placeholder: PropTypes.string,
    className: PropTypes.string,
    onCardTypeChange: PropTypes.func,
    onValidityChange: PropTypes.func,
    onNotEmpty: PropTypes.func,
    onFocus: PropTypes.func,
    onEmpty: PropTypes.func,
    onBlur: PropTypes.func,
    prefill: PropTypes.string,
  }

  static contextType = Context;

  state = {};

  focus() {
    this.context.braintreeApi.focusField(this.props.type);
  }

  clear() {
    this.context.braintreeApi.clearField(this.props.type);
  }

  setPlaceholder(text) {
    this.context.braintreeApi.setAttribute(this.props.type, 'placeholder', text);
  }

  componentDidMount() {
    const [field_id, onRenderComplete] = this.context.braintreeApi.checkInField(this.props);

    this.setState({
      field_id
    }, onRenderComplete);
  }

  get className() {
    const list = [ 'braintree-hosted-field' ];

    if (this.props.className) {
      list.push(this.props.className);
    }
    
    return list.join(' ');
  }

  render() {
    const {
      field_id
    } = this.state;

    if (!field_id) {
      return null;
    }

    return <div id={ field_id } className={ this.className }/>;
  }
}
