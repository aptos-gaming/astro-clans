import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { toast } from 'react-toastify'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import { Provider, Network, AptosClient } from "aptos"

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import { AccountTokensV2WithDataQuery } from '../components/TokensList'
import { TokensList } from '../components'
import CONFIG from '../config.json'

const DevnetClientUrl = "https://fullnode.devnet.aptoslabs.com/v1"
const TestnetClientUrl = "https://fullnode.testnet.aptoslabs.com"

const client = new AptosClient(CONFIG.network === "devnet" ? DevnetClientUrl : TestnetClientUrl)
const provider = new Provider(CONFIG.network === "devnet" ?  Network.DEVNET : Network.TESTNET);

const Player = () => {
  const { coinBalances } = useCoinBalances()
  const { tokenBalances } = useTokenBalances()
  const [ownerAddress, setOwnerAddress] = useState('')
  const { account, signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()

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
        pending: 'Mining new tolen...',
        success: 'Token minted',
        error: 'Error during mint token'
      })
      await apolloClient.refetchQueries({ include: [AccountTokensV2WithDataQuery]})
    } catch (e) {
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
    }
  }, [account])

  const onAirdropResources = async () => {

  }

  return (
    <>
      {tokenBalances && tokenBalances.length < 2 ? (
        <Button
          disabled={!account}
          onClick={onMintPlanet}
          type='primary'
        >
          Mint A Planet
        </Button>
      ) : null}
      {/* show only if user dont have some minimal resources on the balance */}
      <Button
        onClick={onAirdropResources}
        style={{ marginLeft: '8px' }}
        type='primary'
      >
        Airdrop Resources
      </Button>
      <TokensList />
    </>
  )
}

export default Player