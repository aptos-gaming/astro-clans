import * as React from 'react'
import { Tabs, TabsProps } from 'antd'

import PvELayout from './PvELayout'
import DexLayoyt from './DexLayout'
import StakingLayout from './StakingLayout'
import { TokensList } from './components'

const items: TabsProps['items'] = [{
  key: '1',
  label: 'Token Staking',
  children: (
    <>
      <TokensList  />
      <StakingLayout />
    </>
  ),
}, {
  key: '2',
  label: 'Marketplace',
  children: (
    <>
      <DexLayoyt />
    </>
  ),
},
{
  key: '3',
  label: 'PvE Battles',
  children: (
    <>
      <PvELayout />
    </>
  ),
}]

const AdminLayout = () => {
  return (
    <Tabs type="card" defaultActiveKey="1" items={items} />
  )
}

export default AdminLayout