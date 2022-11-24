import Braintree from 'braintree-web/client'
import HostedFields from 'braintree-web/hosted-fields'
import BraintreeDataCollector from 'braintree-web/data-collector'
import BraintreeThreeDSecure from 'braintree-web/three-d-secure'

function capitalise(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default class BraintreeClientApi {
  fields = Object.create(null);

  _next_field_id = 0;

  field_handlers = Object.create(null);

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
          this.create(client_instance, onAuthorizationSuccess);

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

  nextFieldId() {
    this._next_field_id += 1;
    return this._next_field_id;
  }

  onError(error) {
    if (!error) {
      return;
    }

    if (this.wrapper_handlers.onError) {
      this.wrapper_handlers.onError(error);
    }
  }

  create(client, onAuthorizationSuccess) {
    this.client = client;

    HostedFields.create({
      client,
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

      events.forEach((eventName) => {
        hosted_fields.on(eventName, ev => this.onFieldEvent(`on${capitalise(eventName)}`, ev));
      });

      this.onError(error);

      if (onAuthorizationSuccess) {
        onAuthorizationSuccess();
      }
    })
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
      this.field_handlers[type] = handlers
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

  onFieldEvent(eventName, event) {
    const field_handlers = this.field_handlers[event.emittedBy]
    if (field_handlers && field_handlers[eventName]) {
      field_handlers[eventName](event.fields[event.emittedBy], event);
    }
    if (this.wrapper_handlers[eventName]) {
      this.wrapper_handlers[eventName](event);
    }
  }

  tokenize(options = {}) {
    return new Promise((resolve, reject) => { // eslint-disable-line no-undef
      this.hosted_fields.tokenize(options, (error, payload) => {
        if (error) {
          this.onError(error);
          reject(error);
        } else {
          resolve(payload);
        }
      });
    });
  }
}
