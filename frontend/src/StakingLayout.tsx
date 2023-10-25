import React, { useEffect, useState } from 'react'
import { Col } from "antd";
import { Network, Provider, AptosClient } from "aptos"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { useApolloClient } from '@apollo/client'
import { toast } from 'react-toastify'

import { AccountTokensV2WithDataQuery } from './components/TokensList'
import useSelectedToken from './context/useSelectedToken'
import useCollectionOwner from './context/useCollectionOwner'
import CreateCollectioForm from './components/StakingForms/CreateCollectionForm'
import { StakePlanetModal } from './components'
import InitStakingForm from './components/StakingForms/InitStakingForm'
import CONFIG from "./config.json"

const PackageName = "staking"

const DevnetClientUrl = "https://fullnode.devnet.aptoslabs.com/v1"
const TestnetClientUrl = "https://fullnode.testnet.aptoslabs.com"

const client = new AptosClient(CONFIG.network === "devnet" ? DevnetClientUrl : TestnetClientUrl)
const provider = new Provider(CONFIG.network === "devnet" ?  Network.DEVNET : Network.TESTNET);

const Decimals = 8

const StakingLayout = () => {
  const [unclaimedReward, setUnclaimedReward] = useState(0)
  const { selectedToken, setSelectedToken } = useSelectedToken()
  const { collectionOwnerAddress, setCollectionOwnerAddress } = useCollectionOwner()
  const apolloClient = useApolloClient()

  // @todo: remove this as it dublicates collectionOwnerAddress
  const [ownerAddress, setOwnerAddress] = useState('')
  const [rewardCoinType, setRewardCoinType] = useState('')

  const { account, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    async function init() {
      if (account?.address) {
        getCollectionOwnerAddress()
      }
    }
    init()
    
  }, [account?.address])

  useEffect(() => {
    if (collectionOwnerAddress) {
      getRewardCoinType()
    }
  }, [collectionOwnerAddress])

  const createCollectionWithRewards = async (selectedCoinRewardType: string) => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::create_collection_and_enable_token_upgrade`,
      type_arguments: [selectedCoinRewardType],    
      arguments: [],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Creating colleciton...',
        success: 'Collection created, check your wallet',
        error: 'Error during collection creation'
      })
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    } catch (e) {
      console.log(e)
    }
  }

  const createStaking = async (tokensPerHour: number, amountToTreasury: number) => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::create_staking`,
      type_arguments: [rewardCoinType],
      // dph, collection_name, total_amount
      arguments: [tokensPerHour * (10 ** Decimals), CONFIG.collectionName, amountToTreasury * 10 ** Decimals],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Initing staking...',
        success: 'Staking inited, now you can stake & unstake & claim',
        error: 'Error during staking initiation'
      })
    } catch (e) {
      console.log(e)
    }
  }

  const getRewardCoinType = async () => {
    const payload = {
      function: `${CONFIG.stakingModule}::${PackageName}::get_reward_coin_type`,
      type_arguments: [],
      // collection_owner_address
      arguments: [collectionOwnerAddress]
    }

    try {
      const viewResponse = await provider.view(payload)
      setRewardCoinType(String(viewResponse[0]))
    } catch(e) {
      console.log("Error during getting reward coin type addres")
      console.log(e)
    }
  }

  const getCollectionOwnerAddress = async () => {
    const payload = {
      function: `${CONFIG.stakingModule}::${PackageName}::get_staking_resource_address_by_collection_name`,
      type_arguments: [],
      // creator, collection_name
      arguments: [CONFIG.stakingModule, CONFIG.collectionName]
    }

    try {
      const viewResponse = await provider.view(payload)
      setCollectionOwnerAddress(String(viewResponse[0]))
      setOwnerAddress(String(viewResponse[0]))
    } catch(e) {
      console.log("Error during getting resource account addres")
      console.log(e)
    }
  }

  const onStakeToken = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::stake_token`,
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
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::unstake_token`,
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
    } catch (e) {
      console.log("Error druing unstake token tx")
      console.log(e)
    }
  }

  const onClaimReward = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::claim_reward`,
      type_arguments: [rewardCoinType],
      // staking_creator_addr, token_address, collection_name, token_name
      arguments: [CONFIG.stakingModule, selectedToken?.storage_id, CONFIG.collectionName, selectedToken?.current_token_data.token_name],
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      setSelectedToken(null)
      setUnclaimedReward(0)
      await client.waitForTransactionWithResult(tx.hash)
    } catch (e) {
      console.log("Error druing claim reward tx")
      console.log(e)
    }
  }


  const getUnclaimedReward = async (token: any) => {
    const payload = {
      function: `${CONFIG.stakingModule}::${PackageName}::get_unclaimed_reward`,
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

  useEffect(() => {
    if (selectedToken) {
      getUnclaimedReward(selectedToken)
    }
  }, [selectedToken])

  const onLevelUpgrade = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.stakingModule}::${PackageName}::upgrade_token`,
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

  return (
    <>  
      <Col>
        <h3 className='admin-section'>Token Staking</h3>
        <CreateCollectioForm
          createCollectionWithRewards={createCollectionWithRewards}
          isDisabled={!account?.address || !!rewardCoinType}
        />
        <div className="divider" />
        <InitStakingForm
          createStaking={createStaking}
          isDisabled={!account?.address || !rewardCoinType}
        />
        <StakePlanetModal
          unclaimedReward={unclaimedReward}
          onClaimReward={onClaimReward}
          onStakeToken={onStakeToken}
          onUnstakeToken={onUnstakeToken}
          onLevelUpgrade={onLevelUpgrade}
          onHide={() => {
            setSelectedToken(null)
            setUnclaimedReward(0)  
          }}
        />
      </Col>
    </>
  );
}

export default StakingLayout;
