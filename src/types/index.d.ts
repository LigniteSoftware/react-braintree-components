import { ApplePaySession } from "braintree-web";
import BraintreeClientApi from "BraintreeClientApi";

declare global {
  interface Window {
    googlePayClient: google.payments.api.PaymentsClient;
    ApplePaySession: ApplePaySession;
  }
}

interface BraintreeCustomerInfo {
  name: string;
  email: string;
  address: {
    country: string;
    postalCode: string;
  }
}

export type PaymentMethodType =  'card' | 'paypal' | 'googlePay' | 'applePay';

type VoidCallback = () => void;
type VoidApiCallback = (api: BraintreeClientApi) => void;
type VoidNumberCallback = () => number;
type VoidStringCallback = () => string;
type PaymentMethodReadyHandler = (methodName: PaymentMethodType) => void;
type DeviceDataHandler = (deviceData: string) => void;
type PaymentDataHandler = (source: string, nonce: string, customerInfo: BraintreeCustomerInfo) => void;
type BraintreeEventHandler = (eventName: string, event: Event) => void;

export {
  BraintreeCustomerInfo,
  VoidCallback,
  VoidApiCallback,
  VoidNumberCallback,
  VoidStringCallback,
  PaymentMethodReadyHandler,
  DeviceDataHandler,
  PaymentDataHandler,
  BraintreeEventHandler
}