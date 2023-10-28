import React, { useEffect, useState } from 'react'
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Col } from 'antd' 

import { hexToText } from './AllContractsTable';
import { provider } from '../aptosClient';
import { Contract, Unit } from '../types';
import CONFIG from '../config.json'

interface RowItemProps {
  rowData: Contract;
  onSelectedContract: (newContract: any) => void;
  unitData: Unit | null;
}

interface ContractsListProps {
  unitsList: Array<Unit>;
  onSelectedContract: (newContract: any) => void;
}

const ContractsList = ({ onSelectedContract, unitsList }: ContractsListProps) => {
  const [contractsList, setContractsList] = useState<Contract[]>([])
  const { account } = useWallet()

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

  useEffect(() => {
    if (account) {
      getContractsList()
    }
  }, [account])
  
  const RowItem: React.FC<RowItemProps> = ({ rowData, onSelectedContract, unitData }) => {
    return (
      <div
        className='enemyItem'
        onClick={() => {
          onSelectedContract({
            contractId: rowData.key,
            coinType: `${rowData.value.coin_address}::${hexToText(rowData.value.resource_type_info.module_name)}::${hexToText(rowData.value.resource_type_info.struct_name)}`,
            unitName: unitData?.value.name,
            unitType: unitData?.value.linked_coin_type,
            resourceName: hexToText(rowData.value.resource_type_info.struct_name),
            fixedPrice: rowData.value.fixed_price,
          })
        }}
      >
        <div style={{ textAlign: 'center'}}>
          <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{unitData?.value.name}</p>
        </div>
        <div className='enemyContainer'>
          <img
            style={{ maxWidth: '250px' }}
            src={unitData?.value.image_url}
            alt="unit"
          />
        </div>
        <div style={{ marginBottom: '8px', textAlign: 'center' }}>
          <span style={{ color: 'white' }}>❤️: {unitData?.value.health} | ⚔️: {unitData?.value.attack}</span>
        </div>
        <div className='itemDetails' style={{ border: '1px solid #ccc', paddingBottom: '8px', borderRadius: '16px', margin: '0 16px'}}>
          <span style={{ marginTop: '4px' }}>Cost:
            <span style={{fontWeight: 'bold', fontSize: '16px'}}> {rowData.value.fixed_price} </span>
            {hexToText(rowData.value.resource_type_info.struct_name)}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <Col>
      <div className='gridContainer'>
        {contractsList.map((rowData) => {
          const unitData = unitsList.find((unit: Unit) => unit.key === rowData.value.unit_id)

          return (
            <RowItem
              rowData={rowData}
              onSelectedContract={onSelectedContract}
              unitData={unitData ? unitData as Unit : null}
            />
          )}
        )}
      </div>
      <div className='divider' />
    </Col>
  );  
}

export default ContractsList
