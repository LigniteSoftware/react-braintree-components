import babel from '@rollup/plugin-babel';

const pkg = require('./package.json');

const external = [
  'react', 
  'prop-types', 
  'braintree-web/data-collector', 
  'braintree-web/client', 
  'braintree-web/hosted-fields', 
  'braintree-web/three-d-secure', 
  'braintree-web/paypal-checkout',
  'braintree-web/google-payment',
  'braintree-web/apple-pay'
];

const plugins = [
  babel({ babelHelpers: 'bundled' })
];

const globals = {
  'react': 'React',
  'invariant': 'invariant',
  'prop-types': 'PropTypes',
  'braintree-web/client': 'Braintree',
  'braintree-web/hosted-fields': 'BraintreeHostedFields',
  'braintree-web/data-collector': 'BraintreeDataCollector',
  'braintree-web/three-d-secure': 'BraintreeThreeDSecure',
  'braintree-web/paypal-checkout': 'PayPalCheckout',
  'braintree-web/google-payment': 'GooglePayment',
  'braintree-web/apple-pay': 'ApplePay'
};

const input = 'src/index.js';

export default [{
  input,
  plugins,
  external,
  output: {
    format: 'umd',
    name: 'react-braintree-components',
    sourcemap: true,
    file: pkg.browser,
    globals,
  }
}, 
// {
//   input,
//   plugins,
//   external,
//   output: {
//     format: 'es',
//     sourcemap: true,
//     file: pkg.module,
//     globals,
//   }
// }
];