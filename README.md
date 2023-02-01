# React Braintree Components

General purpose Braintree components for React integration.

Supports:
- Hosted fields (for credit/debit cards)
- Apple Pay
- Google Pay
- PayPal

## Installation

1. Clone the project
```
git clone git@gitlab.com:lignite/react-braintree-components.git
```

2. Install dependencies
```
npm i
```

3. Build project
```
npm run build
```

## Example

_(Sorry for all of the missing context / variables. This is just meant to give you a general idea of how the component works.)_

```
import { Braintree, HostedField, PayPalButton, GooglePayButton, ApplePayButton } from 'react-braintree-components';

<Braintree
  ready={this.state.google_pay_loaded}
  authorization={this.props.braintreeToken}
  onPaymentData={this.onPaymentData.bind(this)}
  onDeviceData={this.onDeviceData.bind(this)}
  onError={this.onBraintreeError.bind(this)}
  onPaymentMethodReady={this.onPaymentMethodReady.bind(this)}
  getPrice={() => { return this.props.product.object.price }}
  getProductName={() => { return this.props.product.name }}
  getBraintreeApiRef={ref => this.braintree_api = ref}
  styles={{ 
      'input': {
        'font-size': '16px',
        'color': isDarkMode() ? 'white' : 'black',
        'transition': 'color 150ms linear',
        '-webkit-transition': 'color 150ms linear'
      },
      'input.invalid': {
        'color': '#e50000'
      },
      'input.valid': {
        'color': 'green'
      }
  }}
>

  <div>
    <LoadingSpinner hidden={!this.state.payment_loading}/>

    <div className={styles.easy_payment_options} hidden={this.state.payment_loading}>
      <ApplePayButton 
        className={`${styles.easy_payment_button} ${easy_payment_button_size_class} ${styles.apple_pay}`} 
        hidden={!this.state.ready.apple_pay}/>
      <GooglePayButton 
        merchantId={process.env.google_pay.merchant_id}
        className={`${styles.easy_payment_button} ${easy_payment_button_size_class} ${styles.google_pay}`} 
        hidden={!this.state.ready.google_pay}/>
      <PayPalButton 
        className={`${styles.easy_payment_button} ${easy_payment_button_size_class} ${styles.paypal}`} 
        hidden={!this.state.ready.paypal}/>
    </div>
  </div>

  <PaymentErrorComponent error={this.state.payment_error}/>

  <div className={styles.card_payment_container} hidden={!this.state.ready.card}>
    <h3><span>Or pay with card</span></h3>
    <label htmlFor="email">Email</label>
    <div>
      <input 
        id="card-customer-email"
        autoComplete="email"
        name="email"
        type="email"
        className={`${styles.cc_field} ${styles.lignite_input} ${this.validClassForField('email')}`}
        placeholder="elliot@fsociety.com"
        defaultValue={process.env.production ? undefined : 'edwin@lignite.io'}
        disabled={this.state.disabled}
        onChange={this.onEmailChange.bind(this)}
        onFocus={this.onEmailChange.bind(this)}
        onBlur={this.onEmailChange.bind(this)}
        onKeyUp={this.detectEnterPressed.bind(this)}
      />
      <div className={styles.field_error_message} hidden={(this.state.field_errors.email && !this.state.valid_fields.email) ? false : true}>Please enter a valid email address.</div>
    </div>

    <div className={styles.cc_fields_container}>
      <h4>Card information</h4>

      <div className={`${styles.generic_error_message} ${styles.tight}`} hidden={!this.state.show_colour_switch_error}>⚠️ Your device changed its colour theme. You may need to reload the page to see the credit card fields properly.</div>

      <label>Name on card</label>
      <div>
        <input 
          id="card-customer-name" 
          autoComplete="name"
          className={`${styles.cc_field} ${styles.lignite_input} ${this.validClassForField('name')}`} 
          placeholder="Elliot Alderson"
          defaultValue={process.env.production ? undefined : 'Jon Zhang'}
          disabled={this.state.disabled}
          onChange={this.onNameChange.bind(this)}
          onFocus={this.onNameChange.bind(this)}
          onBlur={this.onNameChange.bind(this)}
          onKeyUp={this.detectEnterPressed.bind(this)}
        />
        <div className={styles.field_error_message} hidden={(this.state.field_errors.name && !this.state.valid_fields.name) ? false : true}>Please enter your full name as it appears on your card.</div>
      </div>

      <label>Card number</label>
      <div className={styles.braintree_container}>

        <HostedField 
          type="number" 
          placeholder="4242 4242 4242 4242" 
          className={`${styles.cc_field} ${styles.braintree_input}`}
          onValidityChange={this.braintreeFieldEvent.bind(this)}
          onFocus={this.braintreeFieldEvent.bind(this)}
          onBlur={this.braintreeFieldEvent.bind(this)}
          onInputSubmitRequest={this.detectEnterPressed.bind(this)}
        />
        <div className={styles.cc_logos}>
          <ul>
            <li className={styles.visa}></li>
            <li className={styles.mc}></li>
            <li className={styles.amex}></li>
          </ul>
        </div>
      </div>
      <div className={`${styles.field_error_message} ${styles.tight}`} hidden={this.state.field_errors.number ? false : true}>{this.state.field_errors.number}</div>

      <label>Expiration</label>
      <div className={`${styles.exp_date}`}>
        <div className={`${styles.braintree_container}`}>
          <HostedField 
            type="expirationDate" 
            placeholder="10 / 23" 
            className={`${styles.cc_field} ${styles.braintree_input}`}
            onValidityChange={this.braintreeFieldEvent.bind(this)}
            onFocus={this.braintreeFieldEvent.bind(this)}
            onBlur={this.braintreeFieldEvent.bind(this)}
            onInputSubmitRequest={this.detectEnterPressed.bind(this)}
          />
        </div>

        <div className={`${styles.field_error_message} ${styles.tight}`} hidden={this.state.field_errors.expirationDate ? false : true}>{this.state.field_errors.expirationDate}</div>
      </div>

      <label>CVV</label>
      <div className={`${styles.cvv}`}>
        <div className={`${styles.braintree_container} ${styles.cvv_icon}`}>
          <HostedField 
            type="cvv" 
            placeholder="123" 
            className={`${styles.cc_field} ${styles.braintree_input}`}
            onValidityChange={this.braintreeFieldEvent.bind(this)}
            onFocus={this.braintreeFieldEvent.bind(this)}
            onBlur={this.braintreeFieldEvent.bind(this)}
            onInputSubmitRequest={this.detectEnterPressed.bind(this)}
          />
        </div>

        <div className={`${styles.field_error_message} ${styles.tight}`} hidden={this.state.field_errors.cvv ? false : true}>{this.state.field_errors.cvv}</div>
      </div>
    </div>
  </div>
</Braintree>
```