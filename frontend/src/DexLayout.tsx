import React, { useEffect, useState } from 'react'
import { Input, Col, Modal, Form } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import { toast } from 'react-toastify'

import { CoinBalancesQuery } from './components/CoinBalance'
import { AllPairsTable, CreatePairForm } from './components'
import { formatCoinName, multipleWithDecimal } from './components/DexForms/CreatePairForm'
import SwapContainer from './components/SwapContainer'
import { client, provider } from './aptosClient'
import { SwapPair } from './types'
import CONFIG from './config.json'

const Decimals = 8

const DexLayoyt = () => {
  const { account, signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()

  const [selectedPairData, setSelectedPairData] = useState<SwapPair | null>(null)
  const [tradingPairs, setTradingPairs] = useState([])
  const [isIncreaseReservesVisible, setIsIncreaseReservesVisible] = useState(false)

  // reserves
  const [coinAAmountReserve, setCoinAAmountReserve] = useState(0)
  const [coinBAmountReserve, setCoinBAmountReserve] = useState(0)
  const [coinCAmountReserve, setCoinCAmountReserve] = useState(0)
  const [coinDAmountReserve, setCoinDAmountReserve] = useState(0)

  const onRemovePair = async (coinsFrom: Array<string>, coinsTo: Array<string>, pairId: string) => {
    const typeArguments: Array<any> = []
    coinsFrom.forEach((coinFrom) => typeArguments.push(coinFrom))
    coinsTo.forEach((coinTo) => typeArguments.push(coinTo))
    
    let pairType = "remove_pair"
    
    if (coinsFrom.length === 2 && coinsTo.length === 2) {
      pairType = "remove_quadruple_pair"
    } else if (coinsFrom.length === 2 && coinsTo.length === 1) {
      pairType = "remove_triple_pair"
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.swapModule}::${CONFIG.swapPackageName}::${pairType}`,
      type_arguments: typeArguments,
      arguments: [pairId],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Removing trading pair...',
        success: 'Trading pair removed',
        error: 'Error during trading pair remove'
      })
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
      getAllTradingPairs()
    } catch (e) {
      console.log(e)
    }
  }

  const onIncreaseReserves = async () => {
    if (!coinAAmountReserve || !coinBAmountReserve || !selectedPairData) {
      alert("Put some value in inputs")
      return
    }

    let pairType = "increase_reserves"
    const typeArguments: Array<string> = [selectedPairData.value.coins_from_name[0]]
    const args = [selectedPairData.key, multipleWithDecimal(10 ** Decimals, coinAAmountReserve)]

    if (selectedPairData.value.coins_from_name.length === 2 && selectedPairData.value.coins_to_name.length === 1) {
      pairType = "increase_triple_reserves"
      args.push(
        multipleWithDecimal(10 ** Decimals, coinBAmountReserve),
        multipleWithDecimal(10 ** Decimals, coinCAmountReserve),
      )
      typeArguments.push(selectedPairData.value.coins_from_name[1], selectedPairData.value.coins_to_name[0])
    } else if (selectedPairData.value.coins_from_name.length === 2 && selectedPairData.value.coins_to_name.length === 2) {
      pairType = "increase_quadruple_reserves"
      args.push(
        multipleWithDecimal(10 ** Decimals, coinBAmountReserve),
        multipleWithDecimal(10 ** Decimals, coinCAmountReserve),
        multipleWithDecimal(10 ** Decimals, coinDAmountReserve),
      )
      typeArguments.push(selectedPairData.value.coins_from_name[1], selectedPairData.value.coins_to_name[0], selectedPairData.value.coins_to_name[1])
    } else {
      args.push(multipleWithDecimal(10 ** Decimals, coinCAmountReserve))
      typeArguments.push(selectedPairData.value.coins_to_name[0])
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.swapModule}::${CONFIG.swapPackageName}::${pairType}`,
      type_arguments: typeArguments,
      arguments: args,
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Adding to reserves...',
        success: 'Added to reserves',
        error: 'Error during adding to reserves'
      })
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
      setCoinAAmountReserve(0)
      setCoinBAmountReserve(0)
      setCoinCAmountReserve(0)
      setCoinDAmountReserve(0)
      setIsIncreaseReservesVisible(false)
    } catch (e) {
      console.log(e)
    }
  }

  const getAllTradingPairs = async () => {
    const payload = {
      function: `${CONFIG.swapModule}::${CONFIG.swapPackageName}::get_all_pairs`,
      type_arguments: [],
      arguments: []
    }

    try {
      const allPairsResponse: any = await provider.view(payload)
      setTradingPairs(allPairsResponse[0].data)
    } catch(e) {
      console.log("Error during getting all trading pairs")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account?.address) {
      getAllTradingPairs()
    }
  }, [account?.address])


  return (
    <>
      <SwapContainer selectedPairData={selectedPairData} />
      <div>
        <Col>
          <AllPairsTable
            data={tradingPairs}
            onRemovePair={onRemovePair}
            onSelectedPairData={setSelectedPairData}
            openReservesModal={() => setIsIncreaseReservesVisible(true)}
          />
        </Col>
        <Col>
          <CreatePairForm getAllTradingPairs={getAllTradingPairs} />
        </Col>
        <Modal
          title="Increase reserves"
          open={isIncreaseReservesVisible && !!selectedPairData}
          onCancel={() => setIsIncreaseReservesVisible(false)}
          onOk={onIncreaseReserves}
          okText="Increase"
        >
          <Form className="increase-reserves-form">
            <Form.Item label={`Amount of coins ${formatCoinName(selectedPairData?.value?.coins_from_name[0] || '')}`}>
              <Input
                type="number"
                value={coinAAmountReserve}
                onChange={(e) => setCoinAAmountReserve(Number(e.target.value))}
                placeholder="Amount of coins From moved to reserve"
              />
            </Form.Item>
            <Form.Item label={`Amount of coins ${formatCoinName(selectedPairData?.value?.coins_to_name[0] || '')}`}>
              <Input
                type="number"
                value={coinCAmountReserve}
                onChange={(e) => setCoinCAmountReserve(Number(e.target.value))}
                placeholder="Amount of coins From moved to reserve"
              />
            </Form.Item>
            {selectedPairData && selectedPairData?.value?.coins_from_name.length === 2 && (
              <Form.Item label={`Amount of coins ${formatCoinName(selectedPairData?.value?.coins_from_name[1])}`}>
                <Input
                  type="number"
                  value={coinBAmountReserve}
                  onChange={(e) => setCoinBAmountReserve(Number(e.target.value))}
                  placeholder="Amount of coins From moved to reserve"
                />
              </Form.Item>
            )}
            {selectedPairData && selectedPairData?.value?.coins_from_name.length === 2 && selectedPairData?.value?.coins_to_name.length === 2 && (
              <Form.Item label={`Amount of coins ${formatCoinName(selectedPairData?.value?.coins_to_name[1])}`}>
                <Input
                  type="number"
                  value={coinDAmountReserve}
                  onChange={(e) => setCoinDAmountReserve(Number(e.target.value))}
                  placeholder="Amount of coins From moved to reserve"
                />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </>
  )
}

export default DexLayoyt