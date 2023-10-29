import { toast } from 'react-toastify'
import { ApolloClient } from '@apollo/client'

import { multipleWithDecimal } from './components/DexForms/CreatePairForm'
import { CoinBalancesQuery } from './components/CoinBalance'
import { AccountTokensV2WithDataQuery } from './components/TokensList'
import { client } from './aptosClient'
import { Contract, SwapPair } from './types'
import CONFIG from './config.json'

const Decimals = 8

async function swap (
  coinFromAmount: number,
  selectedPairData: SwapPair | null,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
) {
  if (!selectedPairData) {
    alert("Select one of the pairs please")
    return
  }

  let pairType = "swap"
  const typeArguments: Array<string> = [selectedPairData.value.coins_from_name[0]]
  const args: Array<String | number> = [selectedPairData.key, multipleWithDecimal(10 ** Decimals, coinFromAmount)]

  if (selectedPairData.value.coins_from_name.length === 2 && selectedPairData.value.coins_to_name.length === 1) {
    pairType = "triple_swap"
    args.push(multipleWithDecimal(10 ** Decimals, coinFromAmount))
    typeArguments.push(selectedPairData.value.coins_from_name[1], selectedPairData.value.coins_to_name[0])
  } else if (selectedPairData.value.coins_from_name.length === 2 && selectedPairData.value.coins_to_name.length === 2) {
    pairType = "quadruple_swap"
    args.push(multipleWithDecimal(10 ** Decimals, coinFromAmount))
    typeArguments.push(selectedPairData.value.coins_from_name[1], selectedPairData.value.coins_to_name[0], selectedPairData.value.coins_to_name[1])
  } else {
    typeArguments.push(selectedPairData.value.coins_to_name[0])
  }

  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.swapModule}::${CONFIG.swapPackageName}::${pairType}`,
    type_arguments: typeArguments,
    //            basic swap   triple or quadruple          
    // pair_id, coin_amount_a / coin_amount_b
    arguments: args,
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    toast.promise(client.waitForTransactionWithResult(tx.hash), {
      pending: 'Swapping...',
      success: 'Succesfully swapped',
      error: 'Error during swap'
    })
    await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
  } catch (e) {
    console.log(e)
  }
}

async function attackEnemy (
  selectedEnemy: any,
  unitsForAttack: any,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
) {
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
    function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::${attackType}`,
    // <RewardCoin1Type/RewardCoin2Type, UnitType1/UnitType2 
    type_arguments: payloadTypeArgs,
    // for 1 unit - enemy_level_id: u64, number_of_units: u64, unit_id: u64
    // for 2 units - enemy_level_id: u64, number_of_units_1: u64, number_of_units_2: u64, unit_id_1: u64, unit_id_2: u64,
    arguments: payloadArgs,
  }

  try {
    const tx = await signAndSubmitTransaction(payload)
    await client.waitForTransactionWithResult(tx.hash)
    await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
  } catch (e) {
    console.log("ERROR during attack enemy")
    console.log(e)
  }
}

const airdropResources = async (
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
  userType?: string,
) => {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::${userType === 'admin' ? 'mint_admin_coins' : 'mint_airdrop_coins'}`,
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

const mintPlanet = async (
  ownerAddress: string,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
) => {
  if (!ownerAddress) {
    toast.error('No owner address')
    return
  }

  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::mint_token`,
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

async function buyUnits (
  numberOfUnits: number,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  selectedContract: any,
  onResetForms: () => void,
  apolloClient: ApolloClient<{}>,
) {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::buy_units`,
    // <CoinType, UnitType>
    type_arguments: [selectedContract?.coinType, selectedContract.unitType],
    // contract_id: u64, coins_amount: u64, number_of_units: u64
    arguments: [selectedContract?.contractId, (numberOfUnits * 10 ** Decimals) * selectedContract?.fixedPrice, numberOfUnits]
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    await client.waitForTransactionWithResult(tx.hash)
    await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    onResetForms()
  } catch (e) {
    console.log("ERROR during buy units tx")
    console.log(e)
  }
}

async function levelUpgrade(
  rewardCoinType: string,
  ownerAddress: string,
  selectedToken: any,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
  onResetForms: () => void,
) {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::upgrade_token`,
    type_arguments: [rewardCoinType],
    // collection_owner, token address
    arguments: [ownerAddress, selectedToken?.storage_id],
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    await client.waitForTransactionWithResult(tx.hash)
    onResetForms()
    await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
  } catch (e) {
    console.log("ERROR during token upgrade")
  }
}

async function stakeToken(
  collectionOwnerAddress: string,
  selectedToken: any,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
  onResetForms: () => void,
) {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::stake_token`,
    type_arguments: [],
    // staking_creator_addr, collection_owner_addr, token_address, collection_name, token_name, tokens
    arguments: [CONFIG.stakingModule, collectionOwnerAddress, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name, "1"]
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    toast.promise(client.waitForTransactionWithResult(tx.hash), {
      pending: 'Start Mining on the planet...',
      success: 'Succesfully started mining',
      error: 'Error during mining on the planet'
    })
    await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    onResetForms()
  } catch (e) {
    console.log("Error druing stake token tx")
    console.log(e)
  }
}

async function unstakeToken(
  rewardCoinType: string,
  collectionOwnerAddress: string,
  selectedToken: any,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
  onResetForms: () => void,
) {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::unstake_token`,
    type_arguments: [rewardCoinType],
    // staking_creator_addr, collection_owner_addr, token_address, collection_name, token_name,
    arguments: [CONFIG.stakingModule, collectionOwnerAddress, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name]
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    toast.promise(client.waitForTransactionWithResult(tx.hash), {
      pending: 'Stop Mining on the planet...',
      success: 'Succesfully stoped mining',
      error: 'Error during stoped mining on the planet'
    })
    await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    onResetForms()
  } catch (e) {
    console.log("Error druing unstake token tx")
    console.log(e)
  }
}

async function claimReward (
  rewardCoinType: string,
  selectedToken: any,
  signAndSubmitTransaction: (payload: any) => Promise<{ hash: string}>,
  apolloClient: ApolloClient<{}>,
  onResetForms: () => void,
) {
  const payload = {
    type: "entry_function_payload",
    function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::claim_reward`,
    type_arguments: [rewardCoinType],
    // staking_creator_addr, token_address, collection_name, token_name
    arguments: [CONFIG.stakingModule, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name],
  }
  try {
    const tx = await signAndSubmitTransaction(payload)
    await client.waitForTransactionWithResult(tx.hash)
    await apolloClient.refetchQueries({ include: [CoinBalancesQuery]})
    onResetForms()
  } catch (e) {
    console.log("Error druing claim reward tx")
    console.log(e)
  }
}

export {
  swap,
  attackEnemy,
  airdropResources,
  mintPlanet,
  buyUnits,
  levelUpgrade,
  stakeToken,
  unstakeToken,
  claimReward,
}