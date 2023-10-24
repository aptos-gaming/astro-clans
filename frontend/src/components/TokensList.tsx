import React, { useEffect, useState } from 'react'
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Col } from 'antd' 
import { gql, useQuery as useGraphqlQuery } from '@apollo/client'

import useTokenBalances from '../context/useTokenBalances'
import { TokenV2Props } from '../context/TokenBalancesProvider'
import useSelectedToken from '../context/useSelectedToken'
import CONFIG from '../config.json'

interface RowItemProps {
  rowData: any;
  packageName: string;
  setSelectedToken: (data: any) => void;
}

export const AccountTokensV2WithDataQuery = gql
  `query AccountTokensV2WithDataQuery($owner_address: String) {
    current_token_ownerships_v2_aggregate(
      where: {owner_address: {_eq: $owner_address }, current_token_data: {token_properties: {_has_key: "level"}}},
    ) {
      aggregate {
        count
      }
      nodes {
        is_soulbound_v2
        storage_id
        amount
        current_token_data {
          token_properties
          token_name
          token_uri
        }
      }
    }
  }
`
const PackageName = "staking"

export const TokensList = () => {
  const [tokens, setTokens] = useState<TokenV2Props[]>([])
  const { connected, account } = useWallet()
  const { setSelectedToken } = useSelectedToken()
  const { setTokenBalances } = useTokenBalances()

  const { loading, data } = useGraphqlQuery(AccountTokensV2WithDataQuery, {
    variables: {
      owner_address: account?.address,
      collection_name: CONFIG.collectionName,
    },
    skip: !connected || !account?.address,
  })
 
  const getValidV2TokensList = async () => {
    const allTokens = data?.current_token_ownerships_v2_aggregate.nodes
    setTokens(allTokens)
    setTokenBalances(allTokens)
  }

  useEffect(() => {
    if (data?.current_token_ownerships_v2_aggregate) {
      getValidV2TokensList()
    }
  }, [data])
  
  const RowItem: React.FC<RowItemProps> = ({ rowData, packageName, setSelectedToken }) => {
    return (
      <div
        className='gridItem'
        onClick={() => setSelectedToken({ ...rowData, packageName })}
      >
        <div className='itemImage'>
          <img
            style={{ maxWidth: '250px' }}
            src={rowData.current_token_data.token_uri}
            alt='Nft'
          />
        </div>
        <div className='itemDetails'>
          <span className='planet-level'>⭐ {rowData.current_token_data.token_properties.level}</span>
          <span>Name: {rowData.current_token_data.token_name}</span>
          <span>Resources: Minerals</span>
          <span>Status: {rowData.is_soulbound_v2 ? <span className='planet-farming'>Farming</span> : <span className='planet-available'>Available</span>}</span>
        </div>
      </div>
    );
  };
  
  return (
    <Col>
      {!loading && (
        <div className='gridContainer'>
          {tokens.map((rowData) => (
            <RowItem
              rowData={rowData}
              packageName={PackageName}
              setSelectedToken={setSelectedToken}
            />
          ))}
        </div>
      )}
      <div className='divider' />
    </Col>
  );
  
}
