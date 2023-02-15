import { PropsWithChildren } from 'react';
import PaymentComponent, { PaymentComponentProps } from './PaymentComponent';

export default class ApplePayButton extends PaymentComponent<PropsWithChildren<PaymentComponentProps>> {
  clicked(): void {
    super.clicked();
    this.context.braintreeApi?.showApplePaySheet();
  }

  componentDidMount() {
    this.setState({
      fieldId: this.context.braintreeApi?.checkInApplePayButton()
    });
  }
}
