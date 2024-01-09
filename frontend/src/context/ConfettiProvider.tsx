import React, { useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

export interface IConfettiProviderContext {
  shouldRun: boolean;
  setShouldRun: (shouldRun: boolean) => void;
}

const defaultValues = {
  shouldRun: false,
  setShouldRun: () => {},
}

export const ConfettiProviderContext = React.createContext<IConfettiProviderContext>(defaultValues)

export function ConfettiProvider({ children }: any) {
  const [shouldRun, setShouldRun] = useState<boolean>(false)
  const { width, height } = useWindowSize()
  
  return (
    <ConfettiProviderContext.Provider value={{ shouldRun, setShouldRun }}>
      <Confetti numberOfPieces={shouldRun ? 350 : 0} width={width} height={height} />
      {children}
    </ConfettiProviderContext.Provider>
  )
}