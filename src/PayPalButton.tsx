import { PropsWithChildren } from 'react';
import PaymentComponent, { PaymentComponentProps } from './PaymentComponent';

export default class PayPalButton extends PaymentComponent<PropsWithChildren<PaymentComponentProps>> {
  componentDidMount() {
    const field_id = this.context.braintreeApi?.checkInPayPalButton();

    this.setState({
      fieldId: field_id
    });
  }
}
