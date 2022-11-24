import Braintree from 'braintree-web/client'
import HostedFields from 'braintree-web/hosted-fields'
import PayPalCheckout from 'braintree-web/paypal-checkout';
import GooglePayment from 'braintree-web/google-payment';
import ApplePay from 'braintree-web/apple-pay';
import BraintreeDataCollector from 'braintree-web/data-collector'
import BraintreeThreeDSecure from 'braintree-web/three-d-secure'

function capitalise(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default class BraintreeClientApi {
  _next_field_id = 0;
  fields = Object.create(null);
  field_handlers = Object.create(null);

  /*
  SETUP AND TEARDOWN
  */

  constructor({
    authorization,
    styles,
    onAuthorizationSuccess,
    ...callbacks
  }) {
    this.styles = styles || {};
    this.wrapper_handlers = callbacks || {};
    this.setAuthorization(authorization, onAuthorizationSuccess);
  }

  teardown() {
    if (this.hosted_fields) {
      this.hosted_fields.teardown();
    }

    if (this.pending_auth_timer) {
      clearTimeout(this.pending_auth_timer);
      this.pending_auth_timer = null;
    }
  }
  

  /*
  AUTHORIZATION
  */

  setAuthorization(authorization, onAuthorizationSuccess) {
    if (!authorization && this.authorization) {
      this.teardown();
    } else if (authorization && authorization !== this.authorization) {
      // fields have not yet checked in, delay setting so they can register
      if (0 === Object.keys(this.fields).length && !this.pending_auth_timer) {
        this.pending_auth_timer = setTimeout(() => {
          this.pending_auth_timer = null;
          this.setAuthorization(authorization, onAuthorizationSuccess);
        }, 5)
        return
      }

      if (this.authorization) {
        this.teardown();
      }

      this.authorization = authorization;

      Braintree.create({
        authorization
      }, (error, client_instance) => {
        if (error) {
          this.onError(error);
        } else {
          this.client = client_instance;

          this.createHostedFields();

          if(this.paypal_button_id){
            this.createPayPalButton();
          }

          if(this.google_pay_button_id){
            this.createGooglePayButton();
          }

          if(this.apple_pay_button_id){
            this.createApplePayButton();
          }

          if (this.wrapper_handlers.onThreeDSecureReady) {
            BraintreeThreeDSecure.create({
              client: client_instance,
              version: 2,
            }, this.wrapper_handlers.onThreeDSecureReady);
          }

          if (this.wrapper_handlers.onDataCollectorInstanceReady) {
            BraintreeDataCollector.create({
              client: client_instance,
              kount: true,
            }, this.wrapper_handlers.onDataCollectorInstanceReady);
          }
        }
      })
    }
  }


  /*
  GENERAL
  */
  nextFieldId() {
    this._next_field_id += 1;
    return this._next_field_id;
  }


  /*
  BUTTONS
  */

  // PAYPAL

  checkInPayPalButton(){
    let id = `paypal-button`;

    this.paypal_button_id = `#${id}`;

    const onRenderComplete = () => {
      console.log(`PayPal button render complete!`);
    }

    return [ id, onRenderComplete ];
  }

  createPayPalButton(){
    PayPalCheckout.create({
      client: this.client
    }, (error, instance) => {
      if (error) {
        this.onError('Error setting up PayPal:', error);
        return;
      }
  
      this.paypal = instance;
  
      this.paypal.loadPayPalSDK({
        currency: 'USD',
        intent: 'capture'
      }, (sdk_error) => {
        if(sdk_error){
          return console.error(`Error setting up PayPal SDK:`, sdk_error);
        }
  
        console.warn(`PAYPAL SDK LOADED!`);

        this.setUpPayPalButton();
      });
    });
  }

  setUpPayPalButton(){
    window.paypal.Buttons({
      style: {
        size: 'large',
        height: 55,
        shape: 'rect',
        color: 'blue',
        layout: 'horizontal'
      },
  
      fundingSource: window.paypal.FUNDING.PAYPAL,
  
      createOrder: () => {
        // setDeclineError(true, false);

        return this.paypal.createPayment({
          flow: 'checkout',
          amount: parseFloat(69.00),
          currency: 'USD',
          intent: 'capture',
          enableShippingAddress: false, 
          shippingAddressEditable: false
        });
      },
  
      onApprove: (data, actions) => {
        // setAlternatePaymentProcessing(true);
  
        return this.paypal.tokenizePayment(data, (token_error, payload) => {
          if(token_error){
            this.onError(token_error);
            return;
          }
  
          let billing = payload.details;
          let shipping = payload.details.shippingAddress;

          this.onToken(payload.nonce);
  
          console.warn(`PayPal approved. make payment request!`);

          // makePaymentRequest(true, payload.nonce, {
          //   name: `${billing.firstName} ${billing.lastName || ''}`,
          //   email: billing.email.toLowerCase(),
          //   address: {
          //     country: shipping.countryCode,
          //     postal_code: shipping.postalCode
          //   }
          // }, function(lazarus_error){
          //   if(lazarus_error){
          //     showErrorMessage(`{{{ hasNewlines lang.purchase.payment_error_generic }}} ${lazarus_error}`);
          //   }
  
          //   setAlternatePaymentProcessing(false);
          // });
        });
      },
  
      onCancel: (data) => {
        console.log('PayPal payment cancelled', data);
      },
  
      onError: (generic_error) => {
        this.onError(generic_error);
      }
    }).render(this.paypal_button_id).then(() => {
      document.querySelector(this.paypal_button_id).hidden = false;
  
      // showCreditCardTitle();
    });
  }

  // GOOGLE PAY

  checkInGooglePayButton(){
    let id = `google-pay-button`;

    this.google_pay_button_id = `#${id}`;

    const onRenderComplete = () => {
      console.log(`Google Pay button render complete!`);
    }

    return [ id, onRenderComplete ];
  }

  createGooglePayButton(){
    GooglePayment.create({
      client: this.client,
      googlePayVersion: 2,
      // googleMerchantId: 'merchant_id'
    }, (error, gpay_instance) => {
      window.google_pay_client.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: gpay_instance.createPaymentDataRequest().allowedPaymentMethods,
        existingPaymentMethodRequired: true
      }).then((ready_to_pay) => {
        if (ready_to_pay.result) {
          this.google_pay = gpay_instance;
        }
  
        console.log(ready_to_pay);

        document.querySelector(this.google_pay_button_id).onclick = this.googlePayButtonClicked.bind(this);
      });
    });
  }

  googlePayButtonClicked(){
    console.log('Google Pay please!');

    // setDeclineError(true, false);

    let payment_data_request = this.google_pay.createPaymentDataRequest({
      transactionInfo: {
        currencyCode: 'USD',
        totalPriceStatus: 'FINAL',
        totalPrice: '0.99'
      },
      emailRequired: true
    });

    let payment_method = payment_data_request.allowedPaymentMethods[0];
    payment_method.parameters.billingAddressRequired = true;
    payment_method.parameters.billingAddressParameters = {
      format: 'MIN',
      phoneNumberRequired: false
    };

    console.log(payment_data_request);

    window.google_pay_client.loadPaymentData(payment_data_request).then((payment_data) => {
      // setAlternatePaymentProcessing(true);

      console.log(payment_data);

      this.google_pay.parseResponse(payment_data, (error, payload) => {
        console.log(error, payload);

        if (error) {
          this.onError(error);
          // showErrorMessage(`{{{ hasNewlines lang.purchase.google_pay_error_js_exception }}} ${error}`);
          return;
        }

        let billing = payment_data.paymentMethodData.info.billingAddress;
        console.log(`gpay payment request!`);

        this.onToken(payload.nonce);
        // makePaymentRequest(true, payload.nonce, {
        //   name: billing.name,
        //   email: payment_data.email.toLowerCase(),
        //   address: {
        //     country: billing.countryCode,
        //     postal_code: billing.postalCode
        //   }
        // }, function(lazarus_error){
        //   setAlternatePaymentProcessing(false);

        //   if(lazarus_error){
        //     showErrorMessage(`{{{ hasNewlines lang.purchase.google_pay_error_js_exception }}} ${lazarus_error}`);
        //   }
        // });
      })
    }).catch((exception) => {
      console.warn(`Google Pay`, exception);
    });
  }

  // APPLE PAY

  checkInApplePayButton(){
    let id = `apple-pay-button`;

    this.apple_pay_button_id = `#${id}`;

    const onRenderComplete = () => {
      console.log(`Apple Pay button render complete!`);
    }

    return [ id, onRenderComplete ];
  }

  applePaySupported(){
    return window.ApplePaySession && ApplePaySession.supportsVersion(3) && ApplePaySession.canMakePayments();
  }

  createApplePayButton(){
    console.log(`apple pay supported: `, this.applePaySupported());

    let button = document.querySelector(this.apple_pay_button_id);
    if(!this.applePaySupported()){
      button.hidden = true;
      return;
    }

    ApplePay.create({
      client: this.client
    }, (error, instance) => {
      if (error) {
        console.error('Error creating Apple Pay instance:', error);
        this.onError(error);
        return;
      }

      this.apple_pay = instance;

      button.onclick = this.showApplePaySheet.bind(this);

      showCreditCardTitle();
    });
  }

  getLineItems(){
    return [{
      label: 'sandbox product',
      amount: '1.01',
      type: 'final'
    }];
  }

  showApplePaySheet(){
    // setDeclineError(true, false);

    let payment_request = this.apple_pay.createPaymentRequest({
      lineItems: this.getLineItems(),
      total: {
        label: 'Lignite',
        amount: '1.01'
      },

      requiredBillingContactFields: [
        'postalAddress'
      ],
      requiredShippingContactFields: [
        'name',
        'email'
      ]
    });
    let session = new ApplePaySession(3, payment_request);

    session.onvalidatemerchant = (event) => {
      this.apple_pay.performValidation({
        validationURL: event.validationURL,
        displayName: 'Lignite Software Inc.'
      }, (error, merchant_session) => {
        if (error) {
          console.error(`Error validating merchant session:`, error)
          this.onError(error);
          // showErrorMessage(`{{ lang.purchase.apple_pay_error_unable_to_validate }}\n\n{{{ lang.purchase.payment_error_generic }}} ${error}`);
          return;
        }
        session.completeMerchantValidation(merchant_session);
      });
    };

    session.onpaymentauthorized = (event) => {
      this.apple_pay.tokenize({
        token: event.payment.token
      }, (error, payload) => {
        if (error) {
          console.error('Error tokenising Apple Pay:', error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          this.onError(error);
          // showErrorMessage(`{{{ hasNewlines lang.purchase.apple_pay_error_failed_tokenisation }}}\n\n{{{ lang.purchase.payment_error_generic }}} ${error}`);
          return;
        }

        let billing = event.payment.billingContact;
        let shipping = event.payment.shippingContact;
        console.log(`apple pay payment!`, billing);

        this.onToken(payload.nonce);

        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        // makePaymentRequest(true, payload.nonce, {
        //   name: `${shipping.givenName} ${shipping.familyName}`,
        //   email: shipping.emailAddress.toLowerCase(),
        //   address: {
        //     country: billing.countryCode,
        //     postal_code: billing.postalCode
        //   }
        // }, function(lazarus_error){
        //   session.completePayment(lazarus_error ? ApplePaySession.STATUS_FAILURE : ApplePaySession.STATUS_SUCCESS);

        //   if(lazarus_error){
        //     showErrorMessage(`{{{ hasNewlines lang.purchase.apple_pay_error_js_exception }}} ${lazarus_error}`);
        //   }
        // });
      });
    };

    session.begin();
  }


  /*
  HOSTED FIELDS
  */

  checkInField({
    formatInput,
    maxlength,
    minlength,
    placeholder,
    select,
    type,
    prefill,
    rejectUnsupportedCards,
    id = `braintree-field-wrapper-${this.nextFieldId()}`,
    options = {},
    ...handlers
  }) {
    const onRenderComplete = () => {
      this.field_handlers[type] = handlers;

      this.fields[type] = {
        formatInput,
        maxlength,
        minlength,
        placeholder,
        select,
        prefill,
        selector: `#${id}`,
        ...options,
      }

      if (('number' === type) && rejectUnsupportedCards) {
        this.fields.number.rejectUnsupportedCards = true;
      }
    }

    return [ id, onRenderComplete ];
  }

  createHostedFields() {
    HostedFields.create({
      client: this.client,
      styles: this.styles,
      fields: this.fields,
    }, (error, hosted_fields) => {
      if (error) {
        this.onError(error);
        return;
      }

      this.hosted_fields = hosted_fields;

      let events = [
        'blur', 'focus', 'empty', 'notEmpty',
        'cardTypeChange', 'validityChange',
      ];

      events.forEach((event_name) => {
        hosted_fields.on(event_name, ev => this.onFieldEvent(`on${capitalise(event_name)}`, ev));
      });
    })
  }

  focusField(field_type, callback) {
    this.hosted_fields.focus(field_type, callback);
  }

  clearField(field_type, callback) {
    this.hosted_fields.clear(field_type, callback);
  }

  setAttribute(field_type, name, value) {
    this.hosted_fields.setAttribute({
      field: field_type,
      attribute: name,
      value,
    });
  }

  onFieldEvent(event_name, event) {
    const field_handlers = this.field_handlers[event.emittedBy];

    if (field_handlers && field_handlers[event_name]) {
      field_handlers[event_name](event.fields[event.emittedBy], event);
    }

    if (this.wrapper_handlers[event_name]) {
      this.wrapper_handlers[event_name](event);
    }
  }

  tokenizeHostedFields(){
    this.hosted_fields.tokenize((error, payload) => {
      if (error) {
        this.onError(error);
        reject(error);
        return;
      }
  
      this.onToken(payload.nonce);
    });
  }


  /*
  DATA HANDLING
  */

  onToken(nonce){
    if(!nonce){
      this.onError(`Nonce is null!`);
      return;
    }

    if(this.wrapper_handlers.onToken){
      this.wrapper_handlers.onToken(nonce);
    }
  }

  onError(error) {
    if (!error) {
      return;
    }

    console.error(error);

    if (this.wrapper_handlers.onError) {
      this.wrapper_handlers.onError(error);
    }
  }
}
