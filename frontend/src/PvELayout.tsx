import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import Decimal from 'decimal.js'
import { useApolloClient } from '@apollo/client'
import { attackEnemy } from './onChainUtils'

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
import useConfetti from './context/useConffetti'
import { CoinBalancesQuery } from './components/CoinBalance'
import { client, provider } from './aptosClient'
import { buyUnits } from './onChainUtils'
import CONFIG from "./config.json"

const Decimals = 8

const PvELayout = () => {
  const { coinBalances } = useCoinBalances()
  const { account, signAndSubmitTransaction } = useWallet();
  const apolloClient = useApolloClient()
  const { setShouldRun } = useConfetti()
  const [enemyData, setEnemyData] = useState<any>({})

  const [maxUnits, setMaxUnits] = useState(0)
  const [unitsList, setUnitsList] = useState<Array<Unit>>([])
  const [contractsList, setContractsList] = useState<Array<Contract>>([])
  const [enemyLevelsList, setEnemyLevelsList] = useState<Array<Enemy>>([])
  const [selectedContract, setSelectedContract] = useState<any>()
  const [selectedEnemy, setSelectedEnemy] = useState<{
    levelId: string, attack: string, health: string, name: string, rewardCoinTypes: Array<string>, rewardAmount: number,
  } | null>(null)
  const [numberOfUnits, setNumberOfUnits] = useState<number>(1)
  const [modalWinVisible, setModalWinVisible] = useState(false)
  const [modalLooseVisible, setModalLooseVisible] = useState(false)

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

  const getContractsList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::get_all_unit_contracts`,
      type_arguments: [],
      arguments: [CONFIG.pveOwner]
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
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::get_all_enemy_levels`,
      type_arguments: [],
      arguments: [CONFIG.pveOwner]
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
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::mint_coins`,
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
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::remove_unit_contract`,
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
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::remove_enemy_level`,
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


  useEffect(() => {
    if (account?.address) {
      getUnitsList()
      getContractsList()
      getEnemysList()
    }
  }, [account])

  useEffect(() => {
    if (selectedEnemy) {
      setEnemyData({
        name: selectedEnemy.name,
        rewardType: selectedEnemy?.rewardCoinTypes,
        rewardAmount: selectedEnemy?.rewardAmount,
      })
    }
  }, [selectedEnemy])

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

  const onAttackEnemy = async (unitsForAttack: any) => {
    const battleResult = await attackEnemy(selectedEnemy, unitsForAttack, signAndSubmitTransaction, apolloClient)
    if (!battleResult) return
    // close on attack enenmy modal
    setSelectedEnemy(null)

    if (battleResult === "Win") {
      // run confetti for 2.5s
      setModalWinVisible(true)
      setShouldRun(true)
      setTimeout(() => setShouldRun(false), 2500)
    } else if (battleResult === "Loose") {
      setModalLooseVisible(true)
    }
  }

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
        onAttack={onAttackEnemy}
      />
      <Modal
        title={"Congratulations! Victory!"}
        open={modalWinVisible}
        footer={null}
        onCancel={() => setModalWinVisible(false)}
      >
        <div>
          <span>You just won in battle against
            <span className="bold-text"> {enemyData?.name}</span>, take a look at your reward:</span>
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
          <span>You just lost in battle against strong enemy, prepare better next time!</span>
        </div>
      </Modal>

      {/* Modal to buy Units */}
      <BuyUnitsModal
        maxUnits={maxUnits}
        onBuyUnits={(numberOfUnits: number) => buyUnits(
          numberOfUnits,
          signAndSubmitTransaction,
          selectedContract,
          () => {
            getContractsList()
            setSelectedContract('')
            setNumberOfUnits(0)
          },
          apolloClient
        )}
        onCancel={() => setSelectedContract(null)}
        selectedContract={selectedContract}
      />
    </div>
  );
}

export default PvELayout;
