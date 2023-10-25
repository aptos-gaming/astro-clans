import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { toast } from 'react-toastify'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useApolloClient } from '@apollo/client'
import { Provider, Network, AptosClient } from "aptos"

import useTokenBalances from '../context/useTokenBalances'
import useCoinBalances from '../context/useCoinBalances'
import { CoinBalancesQuery } from '../components/CoinBalance'
import { AccountTokensV2WithDataQuery } from '../components/TokensList'
import { TokensList } from '../components'
import CONFIG from '../config.json'
import Tippy from '@tippyjs/react'

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
      <TokensList />
    </>
  )
}

export default Player