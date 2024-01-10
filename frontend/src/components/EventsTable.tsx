import React from 'react'
import { Table } from 'antd'

const columns = [
  {
    title: 'Enemy Name',
    key: 'Name',
    render: (value: any) => value?.name
  },
  {
    title: 'Result',
    key: 'battle_result',
    render: (value: any) => value?.result
  },
  {
    title: 'Total Units Attack',
    key: 'total_units_attack',
    render: (value: any) => value?.total_units_attack
  },
  {
    title: 'Total Units Health',
    key: 'total_units_health',
    render: (value: any) => value?.total_units_health
  },
  {
    title: 'Reward',
    key: 'Reward',
    render: (value: any) => {
      let reward = ""
      if (value?.result === "Win") {
        value?.reward_coin_amounts.forEach((rewardCoinAmount: any, index: number) => {
          reward += " " + rewardCoinAmount + " " + value?.reward_coin_types[index].split("::")[2]
        })
      }
      return reward
    }
  },
];

const EventsTable = ({ data, enemiesList }: any) => {
  if (!data.length || !enemiesList.length) return <></>

  let mergedData = []
  for (let i = 0; i < data.length; i++) {
    let enemy_level_id = data[i].data.enemy_level_id;
    for (let y = 0; y < enemiesList.length; y++) {
      if (enemy_level_id === enemiesList[y].key) {
        mergedData.push({...data[i].data, ...enemiesList[y].value})
      }
    }
  }

  return (
    <Table dataSource={mergedData || []} columns={columns} />
  )
}

export default EventsTable