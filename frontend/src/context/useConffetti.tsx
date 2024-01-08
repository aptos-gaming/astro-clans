import { useContext } from 'react'

import { IConfettiProviderContext, ConfettiProviderContext } from './ConfettiProvider'

const useConfetti = () => useContext<IConfettiProviderContext>(ConfettiProviderContext)

export default useConfetti