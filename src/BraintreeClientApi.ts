import { BraintreeProps } from 'Braintree';

import { HostedFields } from 'braintree-web';

import * as Braintree from 'braintree-web';

import { GooglePayButtonProps } from 'GooglePayButton';
import { BraintreeCustomerInfo } from 'types';
import { HostedFieldAttributeName, HostedFieldsEventTypeMap, HostedFieldsHostedFieldsFieldName } from 'braintree-web/hosted-fields';
import { HostedFieldProps } from 'HostedField';
import { ButtonColorOption, ButtonLabelOption, ButtonShapeOption, ButtonSizeOption, FlowType, Intent } from 'paypal-checkout-components';

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

type ClientApiCallbackObject = {
  getPrice: Function;
  getProductName: Function;

  [key: string]: Function | undefined;
}

export default class BraintreeClientApi {
  /**
   * The next available hosted field ID that has not been taken.
   */
  private _nextFieldId = 0;

  /**
   * Information about hosted fields. This is NOT the instances of the
   * hosted fields themselves.
   */
  hostedFieldInformation = Object.create(null);

  /**
   * Hosted fields objects.
   */
  hostedFields?: HostedFields;
  
  /**
   * Handlers for hosted field events.
   */
  fieldHandlers = Object.create(null);

  /**
   * CSS styles of this component.
   */
  styles = {};

  /**
   * Callbacks from the component's props
   */
  callbacks: ClientApiCallbackObject;

  /**
   * Braintree client token.
   */
  authorization?: string;

  /**
   * The Braintree client.
   */
  client?: Braintree.Client;

  /**
   * ID of the PayPal button.
   */
  paypalButtonId?: string;

  /**
   * ID of the Google Pay button.
   */
  googlePayButtonId?: string;

  /**
   * ID of the Apple Pay button.
   */
  applePayButtonId?: string;

  /**
   * Google Pay merchant ID.
   */
  googlePayMerchantId?: string;
  
  /**
   * PayPal checkout instance.
   */
  paypal?: Braintree.PayPalCheckout;

  /**
   * Google Pay instance.
   */
  googlePay?: Braintree.GooglePayment;

  /**
   * Apple Pay instance.
   */
  applePay?: Braintree.ApplePay;

  /**
   * Timeout while waiting for authorization to be ready.
   */
  pendingAuthTimeout?: NodeJS.Timeout;

  /*
  SETUP AND TEARDOWN
  */

  constructor(props: BraintreeProps) {
    this.callbacks = {
      getBraintreeApiRef: props.getBraintreeApiRef,
      getPrice: props.getPrice,
      getProductName: props.getProductName,

      onAuthorizationSuccess: props.onAuthorizationSuccess,
      onPaymentMethodReady: props.onPaymentMethodReady,

      onDeviceData: props.onDeviceData,
      onPaymentData: props.onPaymentData,

      onValidityChange: props.onValidityChange,
      onCardTypeChange: props.onCardTypeChange,
      onError: props.onError
    };

    this.styles = props.styles || {};

    this.setAuthorization(props.authorization, props.onAuthorizationSuccess);
  }

  teardown() {
    if (this.hostedFields) {
      this.hostedFields.teardown();
    }

    if (this.pendingAuthTimeout) {
      clearTimeout(this.pendingAuthTimeout);
      this.pendingAuthTimeout = undefined;
    }
  }
  

  /*
  AUTHORIZATION
  */

  /**
   * Set the authorization (client token) for this API instance.
   * @param authorization Client token generated through the Braintree API on the back end.
   * @param onAuthorizationSuccess Callback for when authorization is complete.
   */
  setAuthorization(authorization?: string, onAuthorizationSuccess?: VoidFunction) {
    if (!authorization && this.authorization) {
      this.teardown();
    } 
    else if (authorization && authorization !== this.authorization) {
      // Fields have not yet checked in, delay setting so they can register
      if (0 === Object.keys(this.hostedFieldInformation).length && !this.pendingAuthTimeout) {
        this.pendingAuthTimeout = setTimeout(() => {
          this.pendingAuthTimeout = undefined;
          this.setAuthorization(authorization, onAuthorizationSuccess);
        }, 5);
        return
      }

      // Reset any already existing auth
      if (this.authorization) {
        // this.teardown();
        console.warn('Rejecting duplicate Braintree client creation');
        return;
      }

      this.authorization = authorization;

      console.log(`Creating Braintree client`);

      // Create client
      Braintree.client.create({
        authorization
      }, (error?: Braintree.BraintreeError, instance?: Braintree.Client) => {
        if (error) {
          this.onError(error);
        } 
        else {
          this.client = instance;

          // Set up fields
          this.createHostedFields();

          // Set up any other buttons
          if(this.paypalButtonId){
            this.createPayPalButton();
          }

          if(this.googlePayButtonId){
            this.createGooglePayButton();
          }

          if(this.applePayButtonId){
            this.createApplePayButton();
          }

          // Collect device data if required
          if(this.callbacks.onDeviceData){
            this.collectDeviceData();
          }
        }
      })
    }
  }


  /*
  GENERAL
  */

  /**
   * Get the next field ID to prevent overlap of differing IDs.
   * @returns An integer representing the next available ID.
   */
  get nextFieldId() {
    this._nextFieldId += 1;
    return this._nextFieldId;
  }


  /*
  BUTTONS
  */


  /**
   * Check in the PayPal button for use with the Braintree tag.
   */
  checkInPayPalButton(){
    let id = `paypal-button`;

    this.paypalButtonId = `#${id}`;

    return id;
  }

  /**
   * Instantiate the PayPal button with the Braintree client for use in purchasing the product.
   */
  createPayPalButton(){
    Braintree.paypalCheckout.create({
      client: this.client
    }, (error?: Braintree.BraintreeError, instance?: Braintree.PayPalCheckout) => {
      if (error) {
        this.onError('Error setting up PayPal:', error);
        return;
      }

      this.paypal = instance;
  
      this.paypal?.loadPayPalSDK({
        currency: 'USD',
        intent: 'capture'
      }, (sdk_error) => {
        if(sdk_error){
          return console.error(`Error setting up PayPal SDK:`, sdk_error);
        }

        this.setUpPayPalButton();
      });
    });
  }

  /**
   * Set up the PayPal button's callbacks.
   */
  setUpPayPalButton(){
    window.paypal.Buttons({
      style: {
        size: 'large' as ButtonSizeOption,
        height: 55,
        shape: 'rect' as ButtonShapeOption,
        color: 'blue' as ButtonColorOption,
        label: 'checkout' as ButtonLabelOption,
        tagline: false
      },
      fundingSource: 'paypal',

      createOrder: () => {
        let amount = this.callbacks.getPrice() / 100;

        return this.paypal!.createPayment({
          flow: 'checkout' as FlowType, // Cast to prevent import parent ES module import errors
          amount: amount,
          currency: 'USD',
          intent: 'capture' as Intent,
          enableShippingAddress: true, 
          shippingAddressEditable: false
        });
      },

      onApprove: (data) => {
        return new Promise((resolve, reject) => {
          this.paypal!.tokenizePayment(data, (token_error, payload) => {
            if(token_error){
              this.onError(token_error);
              return;
            }
    
            let billing = payload.details;
            let shipping = payload.details.shippingAddress;

            this.onPaymentData('paypal', payload.nonce, {
              name: `${billing.firstName} ${billing.lastName || ''}`,
              email: billing.email.toLowerCase(),
              address: {
                countryCode: shipping.countryCode,
                postalCode: shipping.postalCode
              }
            });

            resolve(payload); // TODO: investigate this: it might break everything, let's see what happens
          });
        });
      },
  
      onCancel: (data: object) => {
        console.log('PayPal payment cancelled', data);
      },
  
      onError: (error: string) => {
        console.log(`PayPal error`, error);
        if(error === 'Detected popup close'){
          error = 'The PayPal popup was blocked or closed immediately after it opened. Please make sure you are not blocking popups and try again, or use a different payment method.'
        }
        this.onError(error);
      }
    }).render(this.paypalButtonId!);

    if(this.callbacks.onPaymentMethodReady){
      this.callbacks.onPaymentMethodReady('paypal');
    }
  }

  // GOOGLE PAY

  /**
   * Check in the Google Pay button for use.
   * @param props Properties of the Google Pay button.
   */
  checkInGooglePayButton(props: GooglePayButtonProps){
    let id = `google-pay-button`;

    this.googlePayButtonId = `#${id}`;

    this.googlePayMerchantId = props.merchantId;

    return id;
  }

  /**
   * Instantiate the Google Pay button with the current Braintree client and its Google Pay merchant ID.
   */
  createGooglePayButton(){
    Braintree.googlePayment.create({
      client: this.client,
      googlePayVersion: 2,
      googleMerchantId: this.googlePayMerchantId
    }, async (error?: Braintree.BraintreeError, gpay_instance?: Braintree.GooglePayment) => {
      window.googlePayClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: (await gpay_instance?.createPaymentDataRequest())?.allowedPaymentMethods!,
        existingPaymentMethodRequired: true
      }).then((ready_to_pay) => {
        if (ready_to_pay.result) {
          this.googlePay = gpay_instance;
        }

        if(this.callbacks.onPaymentMethodReady){
          this.callbacks.onPaymentMethodReady('googlePay');
        }
      });
    });
  }

  /**
   * Handler for when the Google Pay button is clicked on by the customer.
   */
  async showGooglePaySheet(){
    let payment_data_request = await this.googlePay?.createPaymentDataRequest({
      transactionInfo: {
        currencyCode: 'USD',
        totalPriceStatus: 'FINAL',
        totalPrice: (this.callbacks.getPrice() / 100).toString()
      },
      emailRequired: true
    });

    if(!payment_data_request){
      this.onError(`Creating Google Pay payment data request failed.`);
      return;
    }

    let payment_method = payment_data_request.allowedPaymentMethods[0];
    payment_method.parameters.billingAddressRequired = true;
    payment_method.parameters.billingAddressParameters = {
      format: 'MIN',
      phoneNumberRequired: false
    };

    window.googlePayClient.loadPaymentData(payment_data_request).then((payment_data) => {
      this.googlePay?.parseResponse(payment_data, (error, payload) => {
        console.log(error, payload);

        if (error) {
          this.onError(error);
          return;
        }

        if(!payment_data){
          this.onError('Google Pay payment data is undefined.');
          return;
        }

        const billing = payment_data.paymentMethodData.info?.billingAddress;
        if(!billing){
          this.onError('Google Pay billing data is undefined.');
          return;
        }
        const email = payment_data.email;
        if(!email){
          this.onError('Google Pay email address is undefined.');
          return;
        }

        this.onPaymentData('googlePay', payload.nonce, {
          name: billing.name!,
          email: email.toLowerCase(),
          address: {
            countryCode: billing.countryCode,
            postalCode: billing.postalCode
          }
        });
      })
    }).catch((exception) => {
      if(exception.statusCode !== 'CANCELED'){
        this.onError(exception.statusCode || exception);
      }
    });
  }

  // APPLE PAY

  /**
   * Set up the Apple Pay button for use.
   */
  checkInApplePayButton(){
    let id = `apple-pay-button`;

    this.applePayButtonId = `#${id}`;

    return id;
  }

  // applePaySession(){
  //   return window.ApplePaySession as ApplePaySession;
  // }

  /**
   * Get whether or not Apple Pay is supported on the customer's browser.
   */
  applePaySupported(){
    return ApplePaySession && ApplePaySession.supportsVersion(3) && ApplePaySession.canMakePayments();
  }

  /**
   * Instantiate the Apple Pay button with the current Braintree client.
   */
  createApplePayButton(){
    if(!this.applePaySupported()){
      console.warn(`Apple Pay not supported.`);
      return;
    }

    Braintree.applePay.create({
      client: this.client!
    }, (error?: Braintree.BraintreeError, instance?: Braintree.ApplePay) => {
      if (error) {
        console.error('Error creating Apple Pay instance:', error);
        this.onError(error);
        return;
      }

      this.applePay = instance;

      if(this.callbacks.onPaymentMethodReady){
        this.callbacks.onPaymentMethodReady('applePay');
      }
    });
  }

  /**
   * Get the Apple Pay formatted line items for this purchase.
   */
  getLineItems(): Braintree.ApplePayLineItem[] {
    return [
      {
        label: this.callbacks.getProductName(),
        amount: (this.callbacks.getPrice() / 100).toFixed(2),
        type: 'final'
      }, 
      {
        label: 'Taxes',
        amount: '0.00',
        type: 'final'
      }
    ];
  }

  /**
   * Show the Apple Pay payment sheet for customer interaction.
   */
  showApplePaySheet(){
    let session = new ApplePaySession(3, {
      lineItems: this.getLineItems(),
      total: {
        label: 'Lignite',
        amount: (this.callbacks.getPrice() / 100).toFixed(2)
      },

      requiredBillingContactFields: [
        'postalAddress'
      ],
      requiredShippingContactFields: [
        'name',
        'email'
      ],
      countryCode: 'US',
      currencyCode: 'USD',
      merchantCapabilities: [
        'supports3DS',
        'supportsCredit',
        'supportsDebit'
      ],
      supportedNetworks: [ 'amex', 'mastercard', 'visa' ]
    });

    // Merchant was validated by Apple's servers
    session.onvalidatemerchant = (event) => {
      this.applePay?.performValidation({
        validationURL: event.validationURL,
        displayName: 'Lignite Software Inc.'
      }, (error, merchant_session) => {
        if (error) {
          console.error(`Error validating merchant session:`, error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          this.onError(error);
          return;
        }
        session.completeMerchantValidation(merchant_session);
      });
    };

    // The customer authorized the payment
    session.onpaymentauthorized = (event) => {
      this.applePay?.tokenize({
        token: event.payment.token
      }, (error, payload) => {
        if (error) {
          console.error('Error tokenising Apple Pay:', error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          this.onError(error);
          return;
        }

        if(!payload){
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          this.onError('Failed to get Apple Pay payload.');
          return;
        }

        let billing = event.payment.billingContact!;
        let shipping = event.payment.shippingContact!;

        this.onPaymentData('applePay', payload.nonce, {
          name: `${shipping.givenName} ${shipping.familyName}`,
          email: shipping.emailAddress!.toLowerCase(),
          address: {
            countryCode: billing.countryCode!,
            postalCode: billing.postalCode!
          }
        });

        session.completePayment(ApplePaySession.STATUS_SUCCESS);
      });
    };

    session.begin();
  }


  /*
  HOSTED FIELDS
  */

  /**
   * Instantiate a specific hosted field (credit card field) for use with this Braintree client.
   * @param props The properties of this field.
   * @returns An array containing: [the ID of the field, a function to call when rendering has been completed].
   */
  checkInField(props: HostedFieldProps) {
    let {
      placeholder,
      type,
      prefill,
      rejectUnsupportedCards,
      id = `braintree-field-wrapper-${this.nextFieldId}`,
      ...handlers
    } = props;

    const onRenderComplete = () => {
      this.fieldHandlers[type] = handlers;

      this.hostedFieldInformation[type] = {
        placeholder,
        prefill,
        selector: `#${id}`
      }

      if ((type === 'number') && rejectUnsupportedCards) {
        this.hostedFieldInformation.number.rejectUnsupportedCards = true;
      }
    }

    return { id, onRenderComplete };
  }

  /**
   * Create the hosted fields for visual display.
   */
  createHostedFields() {
    Braintree.hostedFields.create({
      client: this.client,
      styles: this.styles,
      fields: this.hostedFieldInformation,
    }, (error, hostedFields) => {
      if (error) {
        this.onError(error);
        return;
      }

      if(!hostedFields){
        return this.onError('Failed to create hostedFields instance.');
      }

      this.hostedFields = hostedFields;

      type EventType = keyof HostedFieldsEventTypeMap;
      let events: EventType[] = [
        'blur', 
        'focus', 
        'empty', 
        'notEmpty',
        'cardTypeChange', 
        'validityChange', 
        'inputSubmitRequest'
      ];

      events.forEach((event_name) => {
        hostedFields.on(event_name, ev => this.onFieldEvent(event_name, ev));
      });

      if(this.callbacks.onPaymentMethodReady){
        this.callbacks.onPaymentMethodReady('card');
      }
    })
  }

  /**
   * Bring a field into the customer's focus.
   * @param fieldType Field type to focus.
   * @param callback Callback to be called when the field has been focused.
   */
  focusField(fieldType: HostedFieldsHostedFieldsFieldName, callback?: Braintree.callback<any>) {
    this.hostedFields?.focus(fieldType, callback);
  }

  /**
   * Clear a field's contents.
   * @param fieldType Field type to clear.
   * @param callback Callback to be called when the field has been cleared.
   */
  clearField(fieldType: HostedFieldsHostedFieldsFieldName, callback?: Braintree.callback<any>) {
    this.hostedFields?.clear(fieldType, callback);
  }

  /**
   * Set an attribute on a field.
   * @param fieldType Field type to apply the attribute to.
   * @param name Name of the attribute.
   * @param value Value of the attribute.
   */
  setAttribute(fieldType: HostedFieldsHostedFieldsFieldName, name: HostedFieldAttributeName, value: string | boolean) {
    this.hostedFields?.setAttribute({
      field: fieldType,
      attribute: name,
      value: value
    });
  }

  /**
   * Remove an attribute from a field.
   * @param fieldType Field type to remove the attribute from.
   * @param name Name of the attribute.
   * @param value Value of the attribute.
   */
  removeAttribute(fieldType: HostedFieldsHostedFieldsFieldName, name: HostedFieldAttributeName) {
    this.hostedFields?.removeAttribute({
      field: fieldType,
      attribute: name
    });
  }

  /**
   * Event handler for when an event occurs on a hosted field.
   * @param eventName Name of the event that occurred.
   * @param event Event that occurred.
   */
  onFieldEvent(eventName: keyof HostedFieldsEventTypeMap, event: Braintree.HostedFieldsEvent | Braintree.HostedFieldsBinPayload) {
    if(!("emittedBy" in event)){
      console.error(`Cannot handle HostedFieldsBinPayload event type, rejecting field event.`);
      return;
    }

    const field_handlers = this.fieldHandlers[event.emittedBy];

    const keyMap = {
      blur: 'onBlur',
      focus: 'onFocus',
      empty: 'onEmpty',
      notEmpty: 'onNotEmpty',
      cardTypeChange: 'onCardTypeChange',
      validityChange: 'onValidityChange',
      inputSubmitRequest: 'onInputSubmitRequest',
      binAvailable: 'onBinAvailable',
    }

    if (field_handlers && field_handlers[keyMap[eventName]]) {
      field_handlers[keyMap[eventName]](eventName, event);
    }

    if (this.callbacks[keyMap[eventName]]) {
      let callback = this.callbacks[keyMap[eventName]];
      if(callback){
        callback(event);
      }
    }
  }

  /**
   * Tokenize the hosted fields for submission to the Braintree API (payment information is supposedly
   * filled out at this point and the customer is submitting for purchase).
   */
  tokenizeHostedFields(){
    this.hostedFields?.tokenize((error, payload) => {
      if (error) {
        this.onError(error);
        return;
      }
  
      if(!payload){
        return this.onError('Failed to tokenize hostedFields instance!');
      }

      this.onPaymentData('card', payload.nonce);
    });
  }


  /*
  DATA HANDLING
  */

  /**
   * Collect information about the customer's device so that Braintree can more accurately
   * process someone's purchase and associate relevant information to their purchase.
   * 
   * This function does not return anything, but instead relies on passing the data back
   * through the `onDeviceData()` callback that should be provided in the <Braintree> JSX
   * object.
   */
  collectDeviceData(){
    Braintree.dataCollector.create({
      client: this.client!,
      paypal: true
    }, (error, data_collector_instance) => {
      if(error){
        return this.onError(error);
      }

      if(!data_collector_instance){
        return this.onError('Failed to create Braintree data collector.');
      }

      if(this.callbacks.onDeviceData){
        this.callbacks.onDeviceData(data_collector_instance.deviceData);
      }
    });
  }

  /**
   * Payment data has been received from a source *other than* hosted fields. This data will
   * be passed along for processing.
   * @param source Source of the data. For example, 'paypal'.
   * @param nonce The nonce of the payment.
   * @param customerInfo Information about the customer.
   */
  onPaymentData(source: string, nonce: string, customerInfo?: BraintreeCustomerInfo){
    if(!nonce){
      this.onError('Nonce is null');
      return;
    }

    if(this.callbacks.onPaymentData){
      this.callbacks.onPaymentData(source, nonce, customerInfo);
    }
  }

  /**
   * Generic error(s) have occurred.
   * @param errors The error(s) that have occurred.
   */
  onError(...errors: any[]) {
    if (errors.length === 0) {
      return;
    }

    console.error(`Braintree error: `, errors);

    if (this.callbacks.onError) {
      this.callbacks.onError(errors.join(' '));
    }
    else{
      console.warn('(No error handler!)')
    }
  }
}
