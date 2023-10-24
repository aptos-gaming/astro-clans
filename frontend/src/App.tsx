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
import { ToastContainer } from 'react-toastify'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { CollectionOwnerProvider} from './context/CollectionOwnerProvider'
import { TokenBalancesProvider } from './context/TokenBalancesProvider'
import { CoinBalancesProvider } from './context/CoinBalancesProvider'
import { SelectedTokenProvider } from './context/SelectedTokenProvider'
import WalletConnect from './components/WalletConnect'
import CoinBalance from './components/CoinBalance'
import CONFIG from './config.json'
import { Home, Admin, Player } from './pages'

const APTOS_GRAPH = `https://indexer-${CONFIG.network}.staging.gcp.aptosdev.com/v1/graphql`

function getGraphqlClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: new HttpLink({
      uri: APTOS_GRAPH,
    }),
    cache: new InMemoryCache(),
  })
}


const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/admin",
    element: (
      <>
        <WalletConnect />
        <CoinBalance />
        <Admin />
      </>
    ),
  },
  {
    path: "/play",
    element: (
      <>
        <WalletConnect />
        <CoinBalance />
        <Player />
      </>
    ),
  }
]);

const App = () => {
  const wallets = [new PetraWallet(), new MartianWallet(), new PontemWallet()];
  const graphqlClient = getGraphqlClient()

  return (
    <ApolloProvider client={graphqlClient}>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
        <CollectionOwnerProvider>
          <TokenBalancesProvider>
            <CoinBalancesProvider>
              <SelectedTokenProvider>
                <RouterProvider router={router} />
                <ToastContainer />
              </SelectedTokenProvider>
            </CoinBalancesProvider>
          </TokenBalancesProvider>
        </CollectionOwnerProvider>
      </AptosWalletAdapterProvider>
    </ApolloProvider>
  );
}

export default App;
