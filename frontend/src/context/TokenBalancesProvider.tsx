import React, { useState } from 'react'

export type TokenV2Props = {
  amount: number,
  current_token_data: {
    token_name: string,
    token_uri: string,
    token_properties: {
      level: string
    },
  },
  storage_id: string,
}

export interface ITokenBalancesContext {
  tokenBalances: Array<TokenV2Props>;
  setTokenBalances: (newBalances: []) => void;
}

const defaultTokenBalances = {
  tokenBalances: [],
  setTokenBalances: () => {},
}

export const TokenBalancesContext = React.createContext<ITokenBalancesContext>(defaultTokenBalances)

export function TokenBalancesProvider({ children }: any) {
  const [tokenBalances, setTokenBalances] = useState([])

  return (
    <TokenBalancesContext.Provider value={{ tokenBalances, setTokenBalances }}>
      {children}
    </TokenBalancesContext.Provider>
  )
}