import BraintreeClientApi from 'BraintreeClientApi';
import { createContext } from 'react';

export type BraintreeApiContext = {
  braintreeApi: BraintreeClientApi | null;
};

export const Context = createContext<BraintreeApiContext>({
  braintreeApi: null
});
