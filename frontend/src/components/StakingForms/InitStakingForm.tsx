import React, { useState } from 'react'
import { Form, Input, Button } from 'antd'

interface InitStakingFormProps {
  createStaking: (tokensPerHour: number, amountToTreasury: number) => Promise<void>,
  isDisabled: boolean,
}

const InitStakingForm = ({ createStaking, isDisabled }: InitStakingFormProps) => {
  // tokensPerHour: number, amountToTreasury

  const [tokensPerHour, setTokensPerHour] = useState(36)
  const [amountToTreasury, setAmountToTreasury] = useState(5000)
  
  return (
    <Form>
      <Form.Item label="Tokens Per Hour">
        <Input
          type="number"
          value={tokensPerHour}
          onChange={(e) => setTokensPerHour(Number(e.target.value))}
          placeholder="Put a number"
        />
      </Form.Item>
      <Form.Item label="Initial Treasury Balance">
        <Input
          type="number"
          value={amountToTreasury}
          onChange={(e) => setAmountToTreasury(Number(e.target.value))}
          placeholder="Inital amount"
        />
      </Form.Item>
      <Button
        disabled={isDisabled}
        onClick={() => createStaking(tokensPerHour, amountToTreasury)}
        type="primary"
      >
        Init Staking
      </Button>
    </Form>
  )
}

export default InitStakingForm