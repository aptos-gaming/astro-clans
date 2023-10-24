import { useContext } from 'react'

import { ITokenBalancesContext, TokenBalancesContext } from './TokenBalancesProvider'

const useTokenBalances = () => useContext<ITokenBalancesContext>(TokenBalancesContext)

export default useTokenBalances