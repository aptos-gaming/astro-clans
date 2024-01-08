import React, { useState } from 'react'
import Confetti from 'react-confetti'

export interface IConfettiProviderContext {
  shouldRun: boolean;
  setShouldRun: (shouldRun: boolean) => void;
}

const defaultValues = {
  shouldRun: false,
  setShouldRun: () => {},
}

export const ConfettiProviderContext = React.createContext<IConfettiProviderContext>(defaultValues)

export function CollectionOwnerProvider({ children }: any) {
  const [shouldRun, setShouldRun] = useState<boolean>(false)

  return (
    <ConfettiProviderContext.Provider value={{ shouldRun, setShouldRun }}>
      <Confetti numberOfPieces={shouldRun ? 500 : 0} width={window.innerWidth} height={window.innerHeight} />
      {children}
    </ConfettiProviderContext.Provider>
  )
}