import React, { useEffect, useState } from 'react'
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Col } from 'antd' 
import { Provider, Network } from "aptos"

import CONFIG from '../config.json'
import { Enemy } from '../types';

const provider = new Provider(CONFIG.network === "devnet" ? Network.DEVNET : Network.TESTNET)

interface RowItemProps {
  rowData: Enemy;
  setSelectedEnemy: (newEnemy: any) => void
}

interface EnemiesListProps {
  enemiesList: Array<any>,
  setSelectedEnemy: (newEnemy: any) => void
}

const EnemiesList = ({ setSelectedEnemy, enemiesList }: EnemiesListProps) => {
  const RowItem: React.FC<RowItemProps> = ({ rowData, setSelectedEnemy }) => {
    return (
      <div
        className='enemy-item'
        onClick={() => {
          setSelectedEnemy({
            levelId: rowData.key,
            name: rowData.value.name,
            attack: rowData.value.attack,
            health: rowData.value.health,
            rewardCoinTypes: rowData.value.reward_coin_types,
            rewardAmount: rowData.value.reward_coin_amounts,
          })
        }}
      >
        <div className="center-text">
          <span className="enemy-item-name">{rowData.value.name}</span>
        </div>
        <div className='enemyContainer'>
          <img
            className="enemy-image"
            src={rowData.value.image_url}
            alt='Enemy'
          />
        </div>
        <div className='item-details'>
          <span className="item-details-health">❤️: {rowData.value.health} | ⚔️: {rowData.value.attack}</span>
          <div className="item-details-reward-container">
            <p>
              <span className="reward-text">Reward: </span>
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
      <div className='grid-container'>
        {enemiesList.map((rowData) => (
          <RowItem
            key={rowData.key}
            rowData={rowData}
            setSelectedEnemy={setSelectedEnemy}
          />
        ))}
      </div>
      <div className='divider' />
    </Col>
  );
}

export default EnemiesList