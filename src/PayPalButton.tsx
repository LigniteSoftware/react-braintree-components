import PaymentComponent from './PaymentComponent';

export default class PayPalButton extends PaymentComponent<{}> {
  componentDidMount() {
    const field_id = this.context.braintreeApi?.checkInPayPalButton();

    this.setState({
      field_id
    });
  }
}
