import React, { useEffect, useState } from 'react'
import { Alert, Button, Tabs, TabsProps, Modal, Switch } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import Tippy from '@tippyjs/react'
import Decimal from 'decimal.js'

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import useSelectedToken from '../context/useSelectedToken'
import useConfetti from '../context/useConffetti'
import {
  EnemiesList,
  AttackEnemyModal,
  TokensList,
  BuyUnitsModal,
  ContractsList,
  StakePlanetModal,
  SwapContainer,
  EventsTable,
} from '../components'
import { SwapPair, Unit } from '../types'
import { client, provider } from '../aptosClient'
import {
  airdropResources, buyUnits, levelUpgrade, mintPlanet, stakeToken, unstakeToken, claimReward, attackEnemy
} from '../onChainUtils'
import CONFIG from '../config.json'

const Decimals = 8

const Player = () => {
  const { coinBalances } = useCoinBalances()
  const { tokenBalances } = useTokenBalances()
  const { selectedToken, setSelectedToken } = useSelectedToken()
  const [ownerAddress, setOwnerAddress] = useState('')
  const { account, signAndSubmitTransaction } = useWallet()
  const { setShouldRun } = useConfetti()
  const [modalWinVisible, setModalWinVisible] = useState(false)
  const [modalLooseVisible, setModalLooseVisible] = useState(false)

  const apolloClient = useApolloClient()
  const [unitsList, setUnitsList] = useState<Array<Unit>>([])
  const [selectedEnemy, setSelectedEnemy] = useState<{
    levelId: string, attack: string, health: string, name: string, rewardCoinTypes: Array<string>, rewardAmount: String,
  } | null>(null)
  const [enemyData, setEnemyData] = useState<any>({})
  const [selectedContract, setSelectedContract] = useState<any>()
  const [maxUnits, setMaxUnits] = useState(0)
  const [unclaimedReward, setUnclaimedReward] = useState(0)
  const [rewardCoinType, setRewardCoinType] = useState('')
  const [selectedPairData, setSelectedPairData] = useState<SwapPair | null>(null)
  const [eventsData, setEventsData] = useState<Array<any>>([])
  const [enemiesList, setEnemiesList] = useState<Array<any>>([])
  const [showBattleLogs, setShowBattleLogs] = useState(false)

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

  const getEnemysList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::get_all_enemy_levels`,
      type_arguments: [],
      arguments: [CONFIG.pveOwner]
    }

    try {
      const allEnemyLevelsResponse: any = await provider.view(payload)
      setEnemiesList(allEnemyLevelsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting enemy levels list")
      console.log(e)
    }
  }

  const onAttackEnemy = async (unitsForAttack: any) => {
    const battleResult = await attackEnemy(selectedEnemy, unitsForAttack, signAndSubmitTransaction, apolloClient)
    await getBattleLogs()
    
    if (!battleResult) return
    // close on attack enenmy modal
    setSelectedEnemy(null)

    if (battleResult === "Win") {
      setShouldRun(true)
      setModalWinVisible(true)
    } else if (battleResult === "Loose") {
      setModalLooseVisible(true)
    }
  }

  const getBattleLogs = async () => {
    const eventStore = `${CONFIG.pveModule}::${CONFIG.pvePackageName}::Events`

    try {
      const attackedEvents = await client.getEventsByEventHandle(account?.address || '', eventStore, "enemy_attacked_event")
  
      setEventsData(attackedEvents)
    } catch (e: any) {
      const errorMessage = JSON.parse(e.message)
      if (errorMessage.error_code === "resource_not_found") {
        console.log("No attackes for now")
      }
    }
  }

  const resetForms = () => {
    setSelectedToken(null)
    setUnclaimedReward(0)
  }

  useEffect(() => {
    if (!modalWinVisible) {
      setShouldRun(false)
    }
  }, [modalWinVisible])

  useEffect(() => {
    if (selectedEnemy) {
      setModalWinVisible(false)
      setModalLooseVisible(false)
    }
  }, [selectedEnemy])

  useEffect(() => {
    if (account) {
      getCollectionOwnerAddress()
      getUnitsList()
      getTradingPairs()
      getEnemysList()
      getBattleLogs()
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

  useEffect(() => {
    if (selectedEnemy) {
      setEnemyData({
        name: selectedEnemy.name,
        rewardType: selectedEnemy?.rewardCoinTypes,
        rewardAmount: selectedEnemy?.rewardAmount,
      })
    }
  }, [selectedEnemy])

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
        className='margin-bottom-16'
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
        className='margin-bottom-16'
      />
      <EnemiesList
        enemiesList={enemiesList}
        setSelectedEnemy={setSelectedEnemy}
      />
      <AttackEnemyModal
        onCancel={() => setSelectedEnemy(null)}
        unitsList={unitsList}
        selectedEnemy={selectedEnemy}
        onAttack={onAttackEnemy}
      />
      <Modal
        title={"Congratulations! Victory!"}
        open={modalWinVisible}
        footer={null}
        onCancel={() => setModalWinVisible(false)}
      >
        <div>
          <span>You just won a battle against the
            <span className="bold-text"> {enemyData?.name}</span>. Take a look at your reward:</span>
          <p className="black-text">
            Your reward is: 
            <span className="bold-text"> {enemyData.rewardAmount} {enemyData.rewardType && String(enemyData?.rewardType)?.split('::')[2]}</span>
          </p>
        </div>
      </Modal>

      <Modal
        title={"Defeat :("}
        open={modalLooseVisible}
        footer={null}
        onCancel={() => setModalLooseVisible(false)}
      >
        <div>
          <span>You just lost a battle against a strong enemy. Prepare better for next time!</span>
        </div>
      </Modal>
      {/* show battle logs */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <span className="white-text">Show Battle Logs: </span>
        <Switch style={{ marginLeft: '1rem' }} checked={showBattleLogs} defaultChecked={false} onChange={() => setShowBattleLogs(!showBattleLogs)} />
      </div>
      {showBattleLogs && (
        <EventsTable data={eventsData} enemiesList={enemiesList} />
      )}
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
      <div className='margin-bottom-16'>
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
              className='airdrop-resources-button'
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
