import { Component, PropsWithChildren, ReactNode } from 'react';
import * as PropTypes from 'prop-types'
import ClientApi from './BraintreeClientApi';
import { Context } from './Context'
import { BraintreeEventHandler, DeviceDataHandler, PaymentDataHandler, PaymentMethodReadyHandler, VoidApiCallback, VoidCallback, VoidNumberCallback, VoidStringCallback } from 'types';

export interface BraintreeProps {
  // Whether or not the component is ready for authorization
  ready: boolean

  // Braintree auth
  authorization?: string;
  
  // HTML attributes
  styles?: object;
  children: ReactNode;

  // Callbacks
  getBraintreeApiRef?: VoidApiCallback;
  getPrice: VoidNumberCallback;
  getProductName: VoidStringCallback;

  onAuthorizationSuccess?: VoidFunction;
  onPaymentMethodReady?: PaymentMethodReadyHandler;

  onDeviceData?: DeviceDataHandler;
  onPaymentData?: PaymentDataHandler;

  onValidityChange?: BraintreeEventHandler;
  onCardTypeChange?: BraintreeEventHandler;
  onError?: BraintreeEventHandler;
}

/**
 * The primary container class for Braintree fields.
 */
export default class Braintree extends Component<BraintreeProps, {}> {
  static propTypes = {
    // Whether or not the component is ready for authorization
    ready: PropTypes.bool,

    // Braintree auth
    authorization: PropTypes.string,
    
    // HTML attributes
    styles: PropTypes.object,
    children: PropTypes.node.isRequired,

    // Callbacks
    getBraintreeApiRef: PropTypes.func,
    getPrice: PropTypes.func,
    getProductName: PropTypes.func,

    onAuthorizationSuccess: PropTypes.func,
    onPaymentMethodReady: PropTypes.func,

    onDeviceData: PropTypes.func,
    onPaymentData: PropTypes.func,

    onValidityChange: PropTypes.func,
    onCardTypeChange: PropTypes.func,
    onError: PropTypes.func,
  }

  private api: ClientApi;

  // Whether or not the API reference was delivered through getBraintreeApiRef()
  private deliveredRef: boolean;

  private contextValue;

  constructor(props: PropsWithChildren<BraintreeProps>) {
    super(props);

    this.api = new ClientApi(props);
    this.deliveredRef = false;

    this.contextValue = {
      braintreeApi: this.api
    }
  }

  componentWillUnmount() {
    this.api.teardown();
  }

  componentDidUpdate() {
    if(this.props.ready){
      this.api.setAuthorization(this.props.authorization, this.props.onAuthorizationSuccess);

      if (this.props.getBraintreeApiRef && !this.deliveredRef) {
        this.props.getBraintreeApiRef(this.api);
        this.deliveredRef = true;
      }
    }
  }

  render() {
    if(!this.props.ready){
      return;
    }

    return (
      <Context.Provider value={ this.contextValue }>
        <div className={'braintree-hosted-fields-wrapper'}>{ this.props.children }</div>
      </Context.Provider>
    );
  }

}
