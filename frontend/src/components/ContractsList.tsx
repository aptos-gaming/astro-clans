import React, { useEffect, useState } from 'react'
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Col } from 'antd' 
import { Provider, Network } from "aptos"

import CONFIG from '../config.json'
import { Contract } from '../types';

const PackageName = "pve_battles"

const provider = new Provider(CONFIG.network === "devnet" ? Network.DEVNET : Network.TESTNET)


interface RowItemProps {
  rowData: Contract;
  setSelectedContract: (newContract: any) => void
}

interface ContractsListProps {
  setSelectedContract: (newContract: any) => void
}

const ContractsList = ({ setSelectedContract }: ContractsListProps) => {
  const [contractsList, setContractsList] = useState<Contract[]>([])
  const { account } = useWallet()

  const getContractsList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${PackageName}::get_all_unit_contracts`,
      type_arguments: [],
      arguments: [account?.address]
    }

    try {
      const allContractsResponse: any = await provider.view(payload)
      console.log("ENEMY: ", allContractsResponse[0].data)

      setContractsList(allContractsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting contracts list")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account) {
      getContractsList()
    }
  }, [account])
  
  const RowItem: React.FC<RowItemProps> = ({ rowData, setSelectedContract }) => {
    return (
      <div
        className='enemyItem'
        onClick={() => {
          // setSelectedContract({
          //   levelId: rowData.key,
          //   name: rowData.value.name,
          //   attack: rowData.value.attack,
          //   health: rowData.value.health,
          //   rewardCoinTypes: rowData.value.reward_coin_types,
          // })
        }}
      >
        <div className='enemyContainer'>
          {/* somehow get image url of unit */}
          {/* <img
            style={{ maxWidth: '250px' }}
            src={rowData.value.image_url}
            alt='Enemy'
          /> */}
        </div>
        <div className='itemDetails'>
          <span style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{rowData.value.unit_id}</span>
          <span style={{ marginTop: '4px' }}>Price: {rowData.value.fixed_price}</span>
        </div>
      </div>
    );
  };
  
  return (
    <Col>
      <div className='gridContainer'>
        {contractsList.map((rowData) => (
          <RowItem
            rowData={rowData}
            setSelectedContract={setSelectedContract}
          />
        ))}
      </div>
      <div className='divider' />
    </Col>
  );  
}

export default ContractsList
