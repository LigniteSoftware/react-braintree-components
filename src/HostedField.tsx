import PaymentComponent, { PaymentComponentProps } from './PaymentComponent';
import PropTypes from 'prop-types';
import { HostedFieldsHostedFieldsFieldName } from 'braintree-web/modules/hosted-fields.js';
import { BraintreeEventHandler } from 'types/index.js';

export interface HostedFieldProps extends PaymentComponentProps {
  /**
   * The input of field, such as card number or expiration date.
   */
  type: HostedFieldsHostedFieldsFieldName;

  id?: string;
  placeholder?: string;
  className?: string;
  prefill?: string;
  rejectUnsupportedCards?: boolean;
  onCardTypeChange?: BraintreeEventHandler;
  onValidityChange?: BraintreeEventHandler;
  onNotEmpty?: BraintreeEventHandler;
  onFocus?: BraintreeEventHandler;
  onEmpty?: BraintreeEventHandler;
  onBlur?: BraintreeEventHandler;
  onInputSubmitRequest?: BraintreeEventHandler;
}

export default class HostedField extends PaymentComponent<HostedFieldProps> {
  static propTypes = {
    type: PropTypes.oneOf([
      'number', 'expirationDate', 'expirationMonth', 'expirationYear', 'cvv', 'postalCode', 'cardholderName',
    ]).isRequired,
    id: PropTypes.string,
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
    rejectUnsupportedCards: PropTypes.bool
  }

  focus() {
    this.context.braintreeApi?.focusField(this.props.type);
  }

  clear() {
    this.context.braintreeApi?.clearField(this.props.type);
  }

  setPlaceholder(text: string) {
    // this.context.braintreeApi?.setAttribute(this.props.type, 'placeholder', text);
  }

  componentDidMount() {
    const results = this.context.braintreeApi?.checkInField(this.props);
    const field_id = results?.id;
    const onRenderComplete = results?.onRenderComplete;

    this.setState({
      field_id
    }, onRenderComplete);
  }
}
