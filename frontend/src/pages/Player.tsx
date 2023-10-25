import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { toast } from 'react-toastify'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import { Provider, Network, AptosClient } from 'aptos'
import Tippy from '@tippyjs/react'

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import { CoinBalancesQuery } from '../components/CoinBalance'
import { EnemiesList, AttackEnemyModal, TokensList } from '../components'
import { AccountTokensV2WithDataQuery } from '../components/TokensList'
import { Unit } from '../types'
import CONFIG from '../config.json'

const DevnetClientUrl = "https://fullnode.devnet.aptoslabs.com/v1"
const TestnetClientUrl = "https://fullnode.testnet.aptoslabs.com"

const client = new AptosClient(CONFIG.network === "devnet" ? DevnetClientUrl : TestnetClientUrl)
const provider = new Provider(CONFIG.network === "devnet" ?  Network.DEVNET : Network.TESTNET);

const Decimals = 8

const Player = () => {
  const { coinBalances } = useCoinBalances()
  const { tokenBalances } = useTokenBalances()
  const [ownerAddress, setOwnerAddress] = useState('')
  const { account, signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()
  const [unitsList, setUnitsList] = useState<Array<Unit>>([])
  const [selectedEnemy, setSelectedEnemy] = useState<{
    levelId: string, attack: string, health: string, name: string, rewardCoinTypes: Array<string>,
  } | null>(null)

  const onMintPlanet = async () => {
    const packageName = "staking"
  
    if (!account) return
    if (!ownerAddress) {
      toast.error('No owner address')
      return
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${packageName}::mint_token`,
      type_arguments: [],
      arguments: [ownerAddress],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Minting new token...',
        success: 'Token minted',
        error: 'Error during token mint'
      })
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    } catch (e) {
      console.log(e)
    }
  }

  const getUnitsList = async () => {
    const packageName = "pve_battles"
    const payload = {
      function: `${CONFIG.pveModule}::${packageName}::get_all_units`,
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

  const onAttackEnemy = async (unitsForAttack: any) => {
    const packageName = "pve_battles"
    const unitType1 = String(Object.values(unitsForAttack)[0])?.split("-")[1]
    const unitId1 = Object.keys(unitsForAttack)[0]
    const numberOfUnits1ForAttack = unitsForAttack[unitId1].split("-")[0]

    if (!unitType1 || !unitId1 || !selectedEnemy) return

    let numberOfUnitTypes = 0
    const unitValues = Object.values(unitsForAttack)
    unitValues.forEach((unitValue: any) => {
      if (Number(unitValue.split("-")[0])) {
        numberOfUnitTypes += 1
      }
    })

    const payloadTypeArgs = [...selectedEnemy?.rewardCoinTypes, unitType1]
    const payloadArgs = [selectedEnemy?.levelId, numberOfUnits1ForAttack * (10 ** Decimals)]

    let unitType2, unitId2, numberOfUnits2ForAttack

    if (numberOfUnitTypes === 2) {
      unitType2 = String(Object.values(unitsForAttack)[1])?.split("-")[1]
      unitId2 = Object.keys(unitsForAttack)[1]
      numberOfUnits2ForAttack = unitsForAttack[unitId2].split("-")[0]
      payloadTypeArgs.push(unitType2)
      payloadArgs.push(numberOfUnits2ForAttack * (10 ** Decimals), unitId1, unitId2)
    } else {
      payloadArgs.push(unitId1)
    }

    let attackType

    if (selectedEnemy.rewardCoinTypes.length > 1 && numberOfUnitTypes > 1) {
      attackType = "attack_enemy_with_two_units_two_reward"
    } else if (selectedEnemy.rewardCoinTypes.length === 1 && numberOfUnitTypes > 1) {
      attackType = "attack_enemy_with_two_units_one_reward"
    } else if (selectedEnemy.rewardCoinTypes.length === 1 && numberOfUnitTypes === 1) {
      attackType = "attack_enemy_with_one_unit_one_reward"
    } else {
      attackType = "attack_enemy_with_one_unit_two_reward"
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${packageName}::${attackType}`,
      // <RewardCoin1Type/RewardCoin2Type, UnitType1/UnitType2 
      type_arguments: payloadTypeArgs,
      // for 1 unit - enemy_level_id: u64, number_of_units: u64, unit_id: u64
      // for 2 units - enemy_level_id: u64, number_of_units_1: u64, number_of_units_2: u64, unit_id_1: u64, unit_id_2: u64,
      arguments: payloadArgs,
    }

    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      // getContractsList()
      // setSelectedContract('')
      setSelectedEnemy(null)
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("ERROR during attack enemy")
      console.log(e)
    }
  }

  const getCollectionOwnerAddress = async () => {
    const packageName = "staking"

    const payload = {
      function: `${CONFIG.stakingModule}::${packageName}::get_staking_resource_address_by_collection_name`,
      type_arguments: [],
      // creator, collection_name
      arguments: [CONFIG.stakingModule, CONFIG.collectionName]
    }

    try {
      const viewResponse = await provider.view(payload)
      setOwnerAddress(String(viewResponse[0]))
    } catch(e) {
      console.log("Error during getting resource account addres")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account) {
      getCollectionOwnerAddress()
      getUnitsList()
    }
  }, [account])

  const onAirdropResources = async () => {
    const packageName = "pve_battles"
  
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${packageName}::mint_coins`,
      type_arguments: [],
      arguments: []
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Airdrop some coins...',
        success: 'Airdrop received',
        error: 'Error during coins airdrop'
      })
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("ERROR during mint coins")
      console.log(e)
    }
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        {/* allow mint token only if user hasnt any tokens or has less than 2 */}
        {(tokenBalances && tokenBalances.length < 2) || tokenBalances.length === 0 ? (
          <Tippy content="Mint a planet with random level property">
            <Button
              onClick={onMintPlanet}
              type='primary'
            >
              Mint A Planet
            </Button>
          </Tippy>
        ) : null}
        {/* allow airdrop only if user hasnt any coins or has less then 1000 Minerals */}
        {(coinBalances.length > 0 && coinBalances.find((coinBalance) => coinBalance.coin_info.name === 'Minerals' &&  coinBalance.amount < 1000 * 10 ** Decimals)) || coinBalances.length === 0 ? (
          <Tippy content="Airdrop 10 000 Minerals and 10 000 Energy Crystals">
            <Button
              onClick={onAirdropResources}
              style={{ marginLeft: '8px' }}
              type='primary'
            >
              Airdrop Resources
            </Button>
          </Tippy>
        ) : null}
      </div>
      {/* Staking UI */}
      <span style={{ color: 'white'}}>To gain more resources you can stake your Planet, reward depends on Planet level, so you can also upgrade Planet to increase resource income</span>
      <TokensList />
      <div className="divider" />
      {/* PvE UI */}
      <span style={{ color: 'white'}}>After you collect some resources, you can hire units for fight</span>
      {/* show UI to hire units */}
      
      <EnemiesList setSelectedEnemy={setSelectedEnemy} />
      <AttackEnemyModal
        onCancel={() => setSelectedEnemy(null)}
        unitsList={unitsList}
        selectedEnemy={selectedEnemy}
        onAttackEnemy={onAttackEnemy}
      />
      {/* Swap UI */}
      
    </>
  )
}

export default Player