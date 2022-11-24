import PaymentComponent from './PaymentComponent.jsx';

export default class PayPalButton extends PaymentComponent {
  componentDidMount() {
    const [field_id, onRenderComplete] = this.context.braintree_api.checkInPayPalButton(this.props);

    this.setState({
      field_id
    }, onRenderComplete);
  }
}
