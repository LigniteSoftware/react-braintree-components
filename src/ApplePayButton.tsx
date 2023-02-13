import PaymentComponent from './PaymentComponent';

export default class ApplePayButton extends PaymentComponent<{}> {
  componentDidMount() {
    const field_id = this.context.braintreeApi?.checkInApplePayButton();

    this.setState({
      field_id
    });
  }
}
