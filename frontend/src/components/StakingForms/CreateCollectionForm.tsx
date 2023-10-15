import React, { useState } from 'react'
import { Form, Select, Button } from 'antd'

import useCoinBalances from '../../context/useCoinBalances'

const  { Option } = Select

interface CreateCollectioFormProps {
  createCollectionWithRewards: (rewardCoinType: string) => Promise<void>,
  isDisabled: boolean,
}

const CreateCollectioForm = ({ createCollectionWithRewards, isDisabled }: CreateCollectioFormProps) => {
  const { coinBalances: coinsList } = useCoinBalances()
  const [selectedCoinRewardType, setSelectedCoinRewardType] = useState("")

  return (
    <Form>
      <Form.Item label="Coin:">
        <Select
          placeholder="Select coin for Reward"
          value={selectedCoinRewardType}
          onChange={(coinSelected) => setSelectedCoinRewardType(coinSelected)}
          optionLabelProp="label"
          labelInValue={false}
        >
          {coinsList.length > 0 && coinsList.map((coinData) => (
            <Option
              value={coinData.coin_type}
              key={coinData.coin_type}
              label={<span>{coinData.coin_info.name}</span>}
            >
              <span>{coinData.coin_info.name} ({coinData.coin_info.symbol})</span>
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Button
        disabled={isDisabled}
        onClick={() => createCollectionWithRewards(selectedCoinRewardType)}
        type="primary"
      >
        Create Collection
      </Button>
    </Form>
  )
}

export default CreateCollectioForm