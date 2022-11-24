import PaymentComponent from './PaymentComponent.jsx';

export default class ApplePayButton extends PaymentComponent {
  componentDidMount() {
    const [field_id, onRenderComplete] = this.context.braintree_api.checkInApplePayButton(this.props);

    this.setState({
      field_id
    }, onRenderComplete);
  }
}
