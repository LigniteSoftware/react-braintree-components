import React from 'react';
import { Context } from './Context'

export interface PaymentComponentProps {
  hidden?: boolean;
  className?: string;
}

interface PaymentComponentState {
  field_id?: string;
}

export default class PaymentComponent<T extends PaymentComponentProps> extends React.Component<T, PaymentComponentState> {
  static contextType = Context;
  declare context: React.ContextType<typeof Context>;

  state: PaymentComponentState = {};

  get className() {
    const list = [ '' ];

    if (this.props.className) {
      list.push(this.props.className);
    }
    
    return list.join(' ');
  }

  render() {
    if (!this.state.field_id) {
      return null;
    }

    return <div id={ this.state.field_id } className={ this.className } hidden={this.props.hidden}/>;
  }
}
