import PaymentComponent from './PaymentComponent.jsx';
import PropTypes from 'prop-types';

export default class HostedField extends PaymentComponent {
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
    onInputSubmitRequest: PropTypes.func,
    prefill: PropTypes.string,
  }

  focus() {
    this.context.braintree_api.focusField(this.props.type);
  }

  clear() {
    this.context.braintree_api.clearField(this.props.type);
  }

  setPlaceholder(text) {
    this.context.braintree_api.setAttribute(this.props.type, 'placeholder', text);
  }

  componentDidMount() {
    const [field_id, onRenderComplete] = this.context.braintree_api.checkInField(this.props);

    this.setState({
      field_id
    }, onRenderComplete);
  }
}
