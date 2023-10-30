import React, { useState, useEffect } from 'react'
import { Row, Input, Button } from 'antd'
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design'
import { formatCoinName, multipleWithDecimal } from './DexForms/CreatePairForm'
import Decimal from 'decimal.js'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'

import { SwapPair } from '../types'
import { swap } from '../onChainUtils'

interface SwapContainerProps {
  selectedPairData: SwapPair | null;
}

const SwapContainer = ({ selectedPairData }: SwapContainerProps) => {
  const [coinFromAmount, setCoinFromAmount] = useState<string>("0")
  const [coinToAmount1, setCoinToAmount1] = useState<string>("0")
  const [coinToAmount2, setCoinToAmount2] = useState<number>(0)
  const { account, signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()

  useEffect(() => {
    if (coinFromAmount && selectedPairData) {
      setCoinToAmount1(Number(multipleWithDecimal(selectedPairData.value.exchange_rates[0], Number(coinFromAmount))) / 100 as any)
      if (selectedPairData.value.exchange_rates[1]) {
        setCoinToAmount2(Number(multipleWithDecimal(selectedPairData.value.exchange_rates[1], Number(coinFromAmount))) / 100)
      }
    }
  }, [coinFromAmount, selectedPairData])

  useEffect(() => {
    setCoinFromAmount("0")
    setCoinToAmount1("0")
    setCoinToAmount2(0)
  }, [selectedPairData])

  return (
    <Row>
      <div className="dex">
        <h2>Trading post</h2>
        <div className="swaps-container">
          {/* Swap from Coins */}
          <div className="swap-from">
            <div className="first-coin">
              {selectedPairData && <p className='coin-name'>{formatCoinName(selectedPairData.value.coins_from_name[0])}</p>}
              <Input
                type="number"
                value={coinFromAmount}
                min={0}
                onChange={(e) => {
                  if (!e.target.value) {
                    return setCoinFromAmount('')
                  }
                  setCoinFromAmount(new Decimal(e.target.value).toString())
                }}
              />
            </div>
            {selectedPairData && selectedPairData?.value?.coins_from_name.length === 2 && (
              <div className="second-coin">
                <p className='coin-name'>{formatCoinName(selectedPairData.value.coins_from_name[1])}</p>
                <Input
                  type="number"
                  min={0}
                  value={coinFromAmount}
                  onChange={(e) => {
                    setCoinFromAmount(new Decimal(e.target.value).toString())
                  }}
                />
              </div>
            )}
          </div>
          <div className="arrow-right-container">
            <img src="../icons/right-arrow.png" alt="arrow-right" />
          </div>
          {/* Swap to Coins*/}
          <div className="swap-to">
            <div className="first-coin">
              {selectedPairData && <p className='coin-name'>{formatCoinName(selectedPairData.value.coins_to_name[0])}</p>}
              <Input type="number" value={coinToAmount1} />
            </div>
            {selectedPairData && selectedPairData?.value?.coins_from_name.length === 2 && selectedPairData?.value?.coins_to_name.length === 2 && (
              <div className="second-coin">
                <p className='coin-name'>{formatCoinName(selectedPairData.value.coins_to_name[1])}</p>
                <Input value={coinToAmount2} type="number" />
              </div>
            )}
          </div>
        </div>
        <div className="swap-button">
          {account?.address ? (
            <Button
              className="swap-button-container"
              onClick={() => swap(Number(coinFromAmount), selectedPairData, signAndSubmitTransaction, apolloClient)}
              block
              type="primary"
            >
              Swap
            </Button>
          ) : (
            <WalletSelector />
          )}
        </div>
      </div>
    </Row>
  )
}

export default SwapContainer