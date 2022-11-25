import React from 'react';
import { Context } from './Context'

export default class PaymentComponent extends React.Component {
  static contextType = Context;

  state = {};

  get className() {
    const list = [ '' ];

    if (this.props.className) {
      list.push(this.props.className);
    }
    
    return list.join(' ');
  }

  render() {
    const {
      field_id
    } = this.state;

    if (!field_id) {
      return null;
    }

    return <div id={ field_id } className={ this.className } hidden={this.props.hidden}/>;
  }
}
