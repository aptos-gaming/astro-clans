import React from 'react'
import { PetraWallet } from "petra-plugin-wallet-adapter"
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter'
import { PontemWallet } from '@pontem/wallet-adapter-plugin'
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react"
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  NormalizedCacheObject,
} from '@apollo/client'

import { CoinBalancesProvider } from './context/CoinBalancesProvider'
import { SelectedTokenProvider } from './context/SelectedTokenProvider'
import WalletConnect from './components/WalletConnect'
import CoinBalance from './components/CoinBalance'
import CONFIG from './config.json'
import DexLayoyt from './DexLayoyt'
import UpgradableTokenV2Layout from './UpgradableTokenV2Layout'
import PvELayout from './PvELayout'

const APTOS_GRAPH = `https://indexer-${CONFIG.network}.staging.gcp.aptosdev.com/v1/graphql`

function getGraphqlClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: new HttpLink({
      uri: APTOS_GRAPH,
    }),
    cache: new InMemoryCache(),
  })
}


const App = () => {
  const wallets = [new PetraWallet(), new MartianWallet(), new PontemWallet()];
  const graphqlClient = getGraphqlClient()

  return (
    <ApolloProvider client={graphqlClient}>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
        <CoinBalancesProvider>
          <SelectedTokenProvider>
            <WalletConnect />
            <CoinBalance />
            <DexLayoyt />
            <UpgradableTokenV2Layout />
            <PvELayout />
          </SelectedTokenProvider>
        </CoinBalancesProvider>
      </AptosWalletAdapterProvider>
    </ApolloProvider>
  );
}

export default App;
