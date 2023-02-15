import React, { PropsWithChildren } from 'react';
import { Context } from './Context'

export interface PaymentComponentProps {
  hidden?: boolean;
  className?: string;
}

interface PaymentComponentState {
  fieldId?: string;
}

export default class PaymentComponent<T extends PropsWithChildren<PaymentComponentProps>> extends React.Component<T, PaymentComponentState> {
  static contextType = Context;
  declare context: React.ContextType<typeof Context>;

  state: PaymentComponentState = {};

  /**
   * Button was clicked.
   */
  clicked(){}

  render() {
    if (!this.state.fieldId) {
      return null;
    }

    return <div id={ this.state.fieldId } className={ this.props.className } hidden={ this.props.hidden } onClick={this.clicked.bind(this)}/>;
  }
}
