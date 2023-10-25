import React, { useEffect, useState } from 'react'
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Col } from 'antd' 
import { Provider, Network } from "aptos"

import CONFIG from '../config.json'
import { Enemy } from '../types';

const PackageName = "pve_battles"

const provider = new Provider(CONFIG.network === "devnet" ? Network.DEVNET : Network.TESTNET)


interface RowItemProps {
  rowData: Enemy;
  setSelectedEnemy: (newEnemy: any) => void
}

interface EnemiesListProps {
  setSelectedEnemy: (newEnemy: any) => void
}

export const EnemiesList = ({ setSelectedEnemy }: EnemiesListProps) => {
  const [enemiesList, setEnemiesList] = useState<Enemy[]>([])
  const { account } = useWallet()

  const getEnemysList = async () => {
    const payload = {
      function: `${CONFIG.pveModule}::${PackageName}::get_all_enemy_levels`,
      type_arguments: [],
      // @todo: change to valid address after final deploy
      arguments: [account?.address]
    }

    try {
      const allEnemyLevelsResponse: any = await provider.view(payload)
      console.log("ENEMY: ", enemiesList)
      setEnemiesList(allEnemyLevelsResponse[0].data)
    } catch(e) {
      console.log("ERROR during getting enemy levels list")
      console.log(e)
    }
  }

  useEffect(() => {
    if (account) {
      getEnemysList()
    }
  }, [account])
  
  const RowItem: React.FC<RowItemProps> = ({ rowData, setSelectedEnemy }) => {
    return (
      <div
        className='enemyItem'
        onClick={() => setSelectedEnemy({ ...rowData })}
      >
        <div className='enemyContainer'>
          <img
            style={{ maxWidth: '250px' }}
            src={rowData.value.image_url}
            alt='Enemy'
          />
        </div>
        <div className='itemDetails'>
          <span style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{rowData.value.name}</span>
          <span style={{ marginTop: '4px' }}>❤️: {rowData.value.health} | ⚔️: {rowData.value.attack}</span>
          <div style={{ border: '1px solid #ccc', marginTop: '12px', borderRadius: '16px'}}>
            <p>
              {rowData.value.reward_coin_amounts.map(
                (rewardAmount: string, index: number) => `${rewardAmount} ${rowData?.value.reward_coin_types[index].split("::")[2]} `
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Col>
      <div className='gridContainer'>
        {enemiesList.map((rowData) => (
          <RowItem
            rowData={rowData}
            setSelectedEnemy={setSelectedEnemy}
          />
        ))}
      </div>
      <div className='divider' />
    </Col>
  );
  
}
