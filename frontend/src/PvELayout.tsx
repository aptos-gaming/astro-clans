import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { Provider, Network } from 'aptos'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { AptosClient } from 'aptos'
import Decimal from 'decimal.js'
import { useApolloClient } from '@apollo/client'

import {
  CreateEnemyForm,
  CreateUnitForm,
  CreateUnitContractForm,
  AllContractsTable,
  AllEnemyLevelsTable,
  UnitsList,
  AttackEnemyModal,
  BuyUnitsModal,
} from './components'
import { Enemy, Unit, Contract } from './types'
import useCoinBalances from './context/useCoinBalances'
import { CoinBalancesQuery } from './components/CoinBalance'
import { attackEnemy } from './onChainUtils'
import CONFIG from "./config.json"

const DevnetClientUrl = "https://fullnode.devnet.aptoslabs.com/v1"
const TestnetClientUrl = "https://fullnode.testnet.aptoslabs.com"

const client = new AptosClient(CONFIG.network === "devnet" ? DevnetClientUrl : TestnetClientUrl)
const provider = new Provider(CONFIG.network === "devnet" ? Network.DEVNET : Network.TESTNET)

const Decimals = 8
const PackageName = "pve_battles"


const PvELayout = () => {
  const { coinBalances } = useCoinBalances()
  const { account, signAndSubmitTransaction } = useWallet();
  const apolloClient = useApolloClient()

  const [maxUnits, setMaxUnits] = useState(0)
  const [unitsList, setUnitsList] = useState<Array<Unit>>([])
  const [contractsList, setContractsList] = useState<Array<Contract>>([])
  const [enemyLevelsList, setEnemyLevelsList] = useState<Array<Enemy>>([])
  const [selectedContract, setSelectedContract] = useState<any>()
  const [selectedEnemy, setSelectedEnemy] = useState<{
    levelId: string, attack: string, health: string, name: string, rewardCoinTypes: Array<string>,
  } | null>(null)
  const [numberOfUnits, setNumberOfUnits] = useState<number>(1)

  const getUnitsList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${PackageName}::get_all_units`,
      type_arguments: [],
      arguments: [account?.address]
    }

    try {
      const allUnitsResponse: any = await provider.view(payload)
      setUnitsList(allUnitsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting units list")
      console.log(e)
    }
  }

  const getContractsList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${PackageName}::get_all_unit_contracts`,
      type_arguments: [],
      arguments: [account?.address]
    }

    try {
      const allContractsResponse: any = await provider.view(payload)
      setContractsList(allContractsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting contracts list")
      console.log(e)
    }
  }

  const getEnemysList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${PackageName}::get_all_enemy_levels`,
      type_arguments: [],
      arguments: [account?.address]
    }

    try {
      const allEnemyLevelsResponse: any = await provider.view(payload)
      setEnemyLevelsList(allEnemyLevelsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting enemy levels list")
      console.log(e)
    }
  }

  const onMintCoins = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::mint_coins`,
      type_arguments: [],
      arguments: []
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("ERROR during mint coins")
      console.log(e)
    }
  }

  const onRemoveContract = async (contractId: string) => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::remove_unit_contract`,
      type_arguments: [],
      // contract_id: u64
      arguments: [contractId]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      getContractsList()
    } catch (e) {
      console.log("ERROR during remove unit contract")
      console.log(e)
    }
  }

  const onRemoveEnemyLevel = async (levelId: string) => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::remove_enemy_level`,
      type_arguments: [],
      // enemy_level_id: u64
      arguments: [levelId]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      getEnemysList()
    } catch (e) {
      console.log("ERROR during remove enemy level")
      console.log(e)
    }
  }

  const onBuyUnits = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::buy_units`,
      // <CoinType, UnitType>
      type_arguments: [selectedContract?.coinType, selectedContract.unitType],
      // contract_id: u64, coins_amount: u64, number_of_units: u64
      arguments: [selectedContract?.contractId, (numberOfUnits * 10 ** Decimals) * selectedContract?.fixedPrice, numberOfUnits]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      getContractsList()
      setSelectedContract('')
      setNumberOfUnits(0)
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("ERROR during buy units tx")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account?.address) {
      getUnitsList()
      getContractsList()
      getEnemysList()
    }
  }, [account])

  useEffect(() => {
    if (selectedContract) {
      const contractResourceBalance = coinBalances?.find((coinBalance) => coinBalance.coin_info.name.includes(selectedContract?.resourceName))
      if (!contractResourceBalance) return
      
      const fullResourceBalance = new Decimal(contractResourceBalance?.amount)
      const validResourceBalance = fullResourceBalance.dividedBy(10 ** Decimals)
      const validMaxAllowedUnits = validResourceBalance.dividedBy(selectedContract?.fixedPrice)
      setMaxUnits(Math.floor(Number(validMaxAllowedUnits.toString())))
    }
  }, [selectedContract])

  return (
    <div>
      {coinBalances.length === 0 && (
        <Button type="primary" onClick={onMintCoins}>Mint Coins</Button>
      )}
      <CreateUnitForm unitsList={unitsList} getUnitsList={getUnitsList} />
      <UnitsList unitsList={unitsList} />
      <div className="divider" />
      <CreateUnitContractForm
        unitsList={unitsList}
        getContractsList={getContractsList}
      />
      <AllContractsTable
        units={unitsList}
        contracts={contractsList}
        onSelectedContract={setSelectedContract}
        onRemoveContract={onRemoveContract}
      />
      <div className="divider" />
      <CreateEnemyForm
        getEnemysList={getEnemysList}
      />
      <AllEnemyLevelsTable
        levels={enemyLevelsList}
        onSelectedLevel={setSelectedEnemy}
        onRemoveEnemyLevel={onRemoveEnemyLevel}
      />
      <div className="divider" />
      {/* Modal to attack PvE enemy */}
      <AttackEnemyModal
        onCancel={() => setSelectedEnemy(null)}
        unitsList={unitsList}
        selectedEnemy={selectedEnemy}
      />
      {/* Modal to buy Units */}
      <BuyUnitsModal
        maxUnits={maxUnits}
        onBuyUnits={onBuyUnits}
        onCancel={() => setSelectedContract(null)}
        selectedContract={selectedContract}
      />
    </div>
  );
}

export default PvELayout;
