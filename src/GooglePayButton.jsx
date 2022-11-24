import PaymentComponent from './PaymentComponent.jsx';

export default class GooglePayButton extends PaymentComponent {
  componentDidMount() {
    const [field_id, onRenderComplete] = this.context.braintree_api.checkInGooglePayButton(this.props);

    this.setState({
      field_id
    }, onRenderComplete);
  }
}
