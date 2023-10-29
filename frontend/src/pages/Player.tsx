import React, { useEffect, useState } from 'react'
import { Alert, Button, Tabs, TabsProps } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import Tippy from '@tippyjs/react'
import Decimal from 'decimal.js'

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import useSelectedToken from '../context/useSelectedToken'
import {
  EnemiesList,
  AttackEnemyModal,
  TokensList,
  BuyUnitsModal,
  ContractsList,
  StakePlanetModal,
  SwapContainer,
} from '../components'
import { SwapPair, Unit } from '../types'
import { provider } from '../aptosClient'
import {
  airdropResources, buyUnits, levelUpgrade, mintPlanet, stakeToken, unstakeToken, claimReward
} from '../onChainUtils'
import CONFIG from '../config.json'

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
  const [selectedPairData, setSelectedPairData] = useState<SwapPair | null>(null)

  const getUnitsList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::get_all_units`,
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
    const payload = {
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::get_staking_resource_address_by_collection_name`,
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

  const getUnclaimedReward = async (token: any) => {
    const payload = {
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::get_unclaimed_reward`,
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

  const getRewardCoinType = async () => {
    const payload = {
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::get_reward_coin_type`,
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
      setSelectedPairData(tradingPairs[0])
    } catch(e) {
      console.log("Error during getting all trading pairs")
      console.log(e)
    }
  }

  const resetForms = () => {
    setSelectedToken(null)
    setUnclaimedReward(0)
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
        description="Start extracting gasolineium from your planets. The yield is determined by the planet's level. By upgrading your planets, you can boost the resource income."
        showIcon
      />
      <TokensList />
      <StakePlanetModal
        unclaimedReward={unclaimedReward}
        onClaimReward={() => claimReward(
          rewardCoinType,
          selectedToken,
          signAndSubmitTransaction,
          apolloClient,
          resetForms,
        )}
        onStakeToken={() => stakeToken(
          ownerAddress,
          selectedToken,
          signAndSubmitTransaction,
          apolloClient,
          resetForms,
        )}
        onUnstakeToken={() => unstakeToken(
          rewardCoinType,
          ownerAddress || '',
          selectedToken,
          signAndSubmitTransaction,
          apolloClient,
          resetForms,
        )}
        onLevelUpgrade={() => levelUpgrade(
          rewardCoinType,
          ownerAddress,
          selectedToken,
          signAndSubmitTransaction,
          apolloClient,
          resetForms,
        )}
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
      <Alert 
        type="info"
        message="Trading post"
        description="You can only extract gasolineium from your planets. To obtain other resources, such as hypersteel and minerals, visit the trading post."
        showIcon
      />
      <SwapContainer selectedPairData={selectedPairData} />
    </>
  );

  const PvEUI = () => (
    <>
      <Alert 
        type="info"
        message="Space fleet"
        description="Recruite mercenaries and send them to hunt space pirates. The more units you send, the higher the chance of success. If you succeed, you will be rewarded with gasolineium and hypersteel."
        showIcon
        style={{ marginBottom: '16px' }}
      />
      <ContractsList onSelectedContract={setSelectedContract} unitsList={unitsList} />
      <BuyUnitsModal
        maxUnits={maxUnits}
        onCancel={() => setSelectedContract(null)}
        selectedContract={selectedContract}
        onBuyUnits={(numberOfUnits: number) => buyUnits(numberOfUnits, signAndSubmitTransaction, selectedContract, () => setSelectedContract(''), apolloClient)}
      />
      <Alert 
        type="warning"
        message="Hunt space pirates!"
        description="You have been attacked by space pirates! Send your mercenaries to defend your planets. If you succeed, you will be rewarded with gasolineium and hypersteel."
        showIcon
        style={{ marginBottom: '16px' }}
      />
      <EnemiesList setSelectedEnemy={setSelectedEnemy} />
      <AttackEnemyModal
        onCancel={() => setSelectedEnemy(null)}
        unitsList={unitsList}
        selectedEnemy={selectedEnemy}
      />
    </>
  );

  const items: TabsProps['items'] = [{
    key: '1',
    label: 'Planet base',
    children: <StakingUI />,
  }, {
    key: '2',
    label: 'Trading post',
    children: <SwapUI />,
  },
  {
    key: '3',
    label: 'Space battles',
    children: <PvEUI />,
  }]

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
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}

export default Player