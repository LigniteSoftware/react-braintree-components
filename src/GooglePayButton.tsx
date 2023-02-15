import PaymentComponent, { PaymentComponentProps } from './PaymentComponent';

export interface GooglePayButtonProps extends PaymentComponentProps {
  merchantId: string;
}

export default class GooglePayButton extends PaymentComponent<GooglePayButtonProps> {
  clicked(): void {
    super.clicked();
    this.context.braintreeApi?.showGooglePaySheet();
  }

  componentDidMount() {
    const field_id = this.context.braintreeApi?.checkInGooglePayButton(this.props);
    
    this.setState({
      fieldId: field_id
    });
  }
}
