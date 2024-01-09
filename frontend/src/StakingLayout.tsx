import React, { useEffect, useState } from 'react'
import { Col, Button } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { useApolloClient } from '@apollo/client'
import { toast } from 'react-toastify'

import { AccountTokensV2WithDataQuery } from './components/TokensList'
import useSelectedToken from './context/useSelectedToken'
import useCollectionOwner from './context/useCollectionOwner'
import CreateCollectioForm from './components/StakingForms/CreateCollectionForm'
import { StakePlanetModal } from './components'
import InitStakingForm from './components/StakingForms/InitStakingForm'
import { client, provider } from './aptosClient'
import { airdropResources, levelUpgrade, stakeToken, unstakeToken, claimReward } from './onChainUtils';
import CONFIG from "./config.json"

const Decimals = 8

const StakingLayout = () => {
  const [unclaimedReward, setUnclaimedReward] = useState(0)
  const { selectedToken, setSelectedToken } = useSelectedToken()
  const { collectionOwnerAddress, setCollectionOwnerAddress } = useCollectionOwner()
  const apolloClient = useApolloClient()

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
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::create_collection_and_enable_token_upgrade`,
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
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::create_staking`,
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
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::get_reward_coin_type`,
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
      function: `${CONFIG.stakingModule}::${CONFIG.stakingPackageName}::get_staking_resource_address_by_collection_name`,
      type_arguments: [],
      // creator, collection_name
      arguments: [CONFIG.stakingModule, CONFIG.collectionName]
    }

    try {
      const viewResponse = await provider.view(payload)
      setCollectionOwnerAddress(String(viewResponse[0]))
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

  useEffect(() => {
    if (selectedToken) {
      getUnclaimedReward(selectedToken)
    }
  }, [selectedToken])

  const resetForms = () => {
    setSelectedToken(null)
    setUnclaimedReward(0)
  }

  return (
    <>  
      <Col>
        <Button
          className='airdrop-resources-button'
          onClick={() => airdropResources(signAndSubmitTransaction, apolloClient, 'admin')}
          type='primary'
        >
          Airdrop Resources
        </Button>
        <h3 className='admin-section'>Token Staking</h3>
        <CreateCollectioForm
          createCollectionWithRewards={createCollectionWithRewards}
          isDisabled={!account?.address || !!rewardCoinType}
        />
        <div className="divider" />
        <InitStakingForm
          createStaking={createStaking}
          isDisabled={!account?.address}
        />
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
            collectionOwnerAddress || '',
            selectedToken,
            signAndSubmitTransaction,
            apolloClient,
            resetForms,
          )}
          onUnstakeToken={() => unstakeToken(
            rewardCoinType,
            collectionOwnerAddress || '',
            selectedToken,
            signAndSubmitTransaction,
            apolloClient,
            resetForms,
          )}
          onLevelUpgrade={() => levelUpgrade(
            rewardCoinType,
            collectionOwnerAddress || '',
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
      </Col>
    </>
  );
}

export default StakingLayout;
