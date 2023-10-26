import React, { useEffect, useState } from 'react'
import { Alert, Button, Tabs } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import Tippy from '@tippyjs/react'
import Decimal from 'decimal.js'

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import useSelectedToken from '../context/useSelectedToken'
import { CoinBalancesQuery } from '../components/CoinBalance'
import {
  EnemiesList,
  AttackEnemyModal,
  TokensList,
  BuyUnitsModal,
  ContractsList,
  StakePlanetModal,
  SwapContainer,
} from '../components'
import { AccountTokensV2WithDataQuery } from '../components/TokensList'
import { Unit } from '../types'
import { client, provider } from '../aptosClient'
import { airdropResources, mintPlanet } from '../onChainUtils'
import CONFIG from '../config.json'

const { TabPane } = Tabs;

const Decimals = 8

const Player = () => {
  const { coinBalances } = useCoinBalances()
  const { tokenBalances } = useTokenBalances()
  const { selectedToken, setSelectedToken } = useSelectedToken()
  const [ownerAddress, setOwnerAddress] = useState('')
  const { account, signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()
  const [unitsList, setUnitsList] = useState<Array<Unit>>([])
  const [selectedEnemy, setSelectedEnemy] = useState<{
    levelId: string, attack: string, health: string, name: string, rewardCoinTypes: Array<string>,
  } | null>(null)
  const [selectedContract, setSelectedContract] = useState<any>()
  const [maxUnits, setMaxUnits] = useState(0)
  const [unclaimedReward, setUnclaimedReward] = useState(0)
  const [rewardCoinType, setRewardCoinType] = useState('')
  const [selectedPairData, setSelectedPairData] = useState<any>(null)

  const getUnitsList = async () => {
    const packageName = "pve_battles"
    const payload = {
      function: `${CONFIG.pveModule}::${packageName}::get_all_units`,
      type_arguments: [],
      arguments: [CONFIG.pveOwner]
    }

    try {
      const allUnitsResponse: any = await provider.view(payload)
      setUnitsList(allUnitsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting units list")
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

  const onBuyUnits = async (numberOfUnits: number) => {
    const packageName = "pve_battles"

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${packageName}::buy_units`,
      // <CoinType, UnitType>
      type_arguments: [selectedContract?.coinType, selectedContract.unitType],
      // contract_id: u64, coins_amount: u64, number_of_units: u64
      arguments: [selectedContract?.contractId, (numberOfUnits * 10 ** Decimals) * selectedContract?.fixedPrice, numberOfUnits]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      setSelectedContract('')
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("ERROR during buy units tx")
      console.log(e)
    }
  }

  const onStakeToken = async () => {
    const packageName="staking"

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${packageName}::stake_token`,
      type_arguments: [],
      // staking_creator_addr, collection_owner_addr, token_address, collection_name, token_name, tokens
      arguments: [CONFIG.stakingModule, ownerAddress, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name, "1"]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      setSelectedToken(null)
      setUnclaimedReward(0)
      await client.waitForTransactionWithResult(tx.hash)
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    } catch (e) {
      console.log("Error druing stake token tx")
      console.log(e)
    }
  }

  const onUnstakeToken = async () => {
    const packageName="staking"

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${packageName}::unstake_token`,
      type_arguments: [rewardCoinType],
      // staking_creator_addr, collection_owner_addr, token_address, collection_name, token_name,
      arguments: [CONFIG.stakingModule, ownerAddress, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      setSelectedToken(null)
      setUnclaimedReward(0)
      await client.waitForTransactionWithResult(tx.hash)
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("Error druing unstake token tx")
      console.log(e)
    }
  }

  const onClaimReward = async () => {
    const packageName="staking"

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${packageName}::claim_reward`,
      type_arguments: [rewardCoinType],
      // staking_creator_addr, token_address, collection_name, token_name
      arguments: [CONFIG.stakingModule, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      setSelectedToken(null)
      setUnclaimedReward(0)
      await client.waitForTransactionWithResult(tx.hash)
      await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    } catch (e) {
      console.log("Error druing claim reward tx")
      console.log(e)
    }
  }


  const getUnclaimedReward = async (token: any) => {
    const packageName="staking"
    const payload = {
      function: `${CONFIG.stakingModule}::${packageName}::get_unclaimed_reward`,
      type_arguments: [],
      // staker_addr, staking_creator_addr, token_address, collection_name, token_name
      arguments: [account?.address, CONFIG.stakingModule, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name]
    }

    try {
      const unclaimedReward = await provider.view(payload)
      setUnclaimedReward(Number(unclaimedReward[0]) / 10 ** Decimals)
    } catch(e) {
      console.log("Error during getting unclaimed")
      console.log(e)
    }
  }

  const onLevelUpgrade = async () => {
    const packageName = "staking"
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${packageName}::upgrade_token`,
      type_arguments: [rewardCoinType],
      // collection_owner, token address
      arguments: [ownerAddress, selectedToken?.storage_id],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      setSelectedToken(null)
      setUnclaimedReward(0)
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    } catch (e) {
      console.log("ERROR during token upgrade")
    }
  }

  const getRewardCoinType = async () => {
    const packageName = "staking"
    const payload = {
      function: `${CONFIG.stakingModule}::${packageName}::get_reward_coin_type`,
      type_arguments: [],
      // collection_owner_address
      arguments: [ownerAddress]
    }

    try {
      const viewResponse = await provider.view(payload)
      setRewardCoinType(String(viewResponse[0]))
    } catch(e) {
      console.log("Error during getting reward coin type addres")
      console.log(e)
    }
  }

  const getTradingPairs = async () => {
    const payload = {
      function: `${CONFIG.swapModule}::${CONFIG.swapPackageName}::get_all_pairs`,
      type_arguments: [],
      arguments: []
    }

    try {
      const allPairsResponse: any = await provider.view(payload)
      const tradingPairs = allPairsResponse[0].data
      console.log("Initial pair: ", tradingPairs[0])
      setSelectedPairData(tradingPairs[0])
    } catch(e) {
      console.log("Error during getting all trading pairs")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account) {
      getCollectionOwnerAddress()
      getUnitsList()
      getTradingPairs()
    }
  }, [account])

  useEffect(() => {
    if (ownerAddress) {
      getRewardCoinType()
    }
  }, [ownerAddress])

  useEffect(() => {
    if (selectedToken) {
      getUnclaimedReward(selectedToken)
    }
  }, [selectedToken])

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

  const StakingUI = () => (
    <>
      <Alert 
        type="info"
        message="Resource extraction"
        description="Start extracting minerals from your planets. The yield is determined by the planet's level. By upgrading your planets, you can boost the resource income."
        showIcon
      />
      <TokensList />
      <StakePlanetModal
        unclaimedReward={unclaimedReward}
        onClaimReward={onClaimReward}
        onStakeToken={onStakeToken}
        onUnstakeToken={onUnstakeToken}
        onLevelUpgrade={onLevelUpgrade}
        rewardCoinType={rewardCoinType}
        onHide={() => {
          setSelectedToken(null)
          setUnclaimedReward(0)  
        }}
      />
    </>
  );

  const SwapUI = () => (
    <>
      <h2 className='white-text'>You can swap your resources using Trading Post:</h2>
      <SwapContainer
        selectedPairData={selectedPairData}
      />
      <div className="divider" />
    </>
  );

  const PvEUI = () => (
    <>
      <span className='white-text'>After you collect some resources, you can hire units to fight with pirates:</span>
      <h2 className='white-text'>Units to Buy:</h2>
      <ContractsList onSelectedContract={setSelectedContract} unitsList={unitsList} />
      <BuyUnitsModal
        maxUnits={maxUnits}
        onBuyUnits={onBuyUnits}
        onCancel={() => setSelectedContract(null)}
        selectedContract={selectedContract}
      />
      <h2 className='white-text'>Enemies to Attack:</h2>
      <EnemiesList setSelectedEnemy={setSelectedEnemy} />
      <AttackEnemyModal
        onCancel={() => setSelectedEnemy(null)}
        unitsList={unitsList}
        selectedEnemy={selectedEnemy}
      />
    </>
  );

  return (
    <div className='player-page-wrapper'>
      <div style={{ marginBottom: '16px' }}>
        {/* allow mint token only if user hasnt any tokens or has less than 2 */}
        {(tokenBalances && tokenBalances.length < 1) || tokenBalances.length === 0 ? (
          <Tippy content="Mint a planet with random level property">
            <Button
              onClick={() => mintPlanet(ownerAddress, signAndSubmitTransaction, apolloClient)}
              type='primary'
            >
              Mint A Planet
            </Button>
          </Tippy>
        ) : null}
        {/* allow airdrop only if user hasnt any coins or has less then 1000 Minerals */}
        {(coinBalances.find((coinBalance) => coinBalance.coin_info.name === 'Gasolineium' &&  coinBalance.amount < 10 * 10 ** Decimals)) || coinBalances.length === 0 ? (
          <Tippy content="Airdrop 100 Gasolineium and 50 Hypersteel">
            <Button
              onClick={() => airdropResources(signAndSubmitTransaction, apolloClient)}
              style={{ marginLeft: '8px' }}
              type='primary'
            >
              Airdrop Resources
            </Button>
          </Tippy>
        ) : null}
      </div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Staking" key="1">
          <StakingUI />
        </TabPane>
        <TabPane tab="Swap" key="2">
          <SwapUI />
        </TabPane>
        <TabPane tab="PvE" key="3">
          <PvEUI />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Player