import React, { useState } from "react"
import { Form, Input, Button, Select } from "antd"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import  { toast } from 'react-toastify'

import useCoinBalances from "../../context/useCoinBalances"
import { client } from "../../aptosClient"
import CONFIG from "../../config.json"

const { Option } = Select;

const layout = {
  labelCol: { span: 3 },
};

interface CreateEnemyLevelFormProps {
  getEnemysList: () => void;
}

const CreateEnemyLevelForm = ({ getEnemysList }: CreateEnemyLevelFormProps) => {
  const { signAndSubmitTransaction } = useWallet()
  const [form] = Form.useForm()
  const { coinBalances } = useCoinBalances()

  const [name, setName] = useState<string>('Starfire Marauder')
  const [attack, setAttack] = useState(10)
  const [health, setHealth] = useState(10)
  const [imageUrl, setImageUrl] = useState('https://github.com/aptos-gaming/astro-clans/blob/master/frontend/public/pirate1.png?raw=true')
  const [rewardCoin1Amount, setRewardCoin1Amount] = useState(100)
  const [rewardCoin2Amount, setRewardCoin2Amount] = useState(100)
  const [selectedResourceType, setSelectedResourceType] = useState<Array<string>>([])

  const onCreateEnemy = async () => {
    if (!name || !attack || !health || !rewardCoin1Amount || (selectedResourceType.length > 1 && !rewardCoin2Amount) || !imageUrl) {
      alert("Missing required fields")
      return
    }

    let enemyLevelType = selectedResourceType.length === 1 ? "create_enemy_level" : "create_enemy_level_with_two_reward_coins"

    const payloadArgs = [name, attack, health, imageUrl, rewardCoin1Amount]
    if (selectedResourceType.length > 1) {
      payloadArgs.push(rewardCoin2Amount)
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::${enemyLevelType}`,
      type_arguments: [...selectedResourceType],
      // name: String, attack: u64, health: u64, image_url: String, reward_coin_1_amount: u64 / reward_coin_2_amount: u64
      arguments: payloadArgs
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Creating new enemy...',
        success: 'New enemy created',
        error: 'Error during creating new enemy'
      })
      getEnemysList()
      setName('')
      setAttack(0)
      setHealth(0)
      setSelectedResourceType([])
      setRewardCoin1Amount(0)
      setRewardCoin2Amount(0)
      setImageUrl('')
    } catch (e) {
      console.log("ERROR during create new enemy level")
      console.log(e)
    }
  }

  return (
    <Form form={form} className="create-unit-form" {...layout}>
      <h3>Create new Enemy:</h3>
      <Form.Item className="margin-top-16" label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enemy Name, aka 'Sea Monster'"
        />
      </Form.Item>
      <Form.Item label="Attack">
        <Input
          type="number"
          value={attack}
          onChange={(e) => setAttack(Number(e.target.value))}
          placeholder="Enemy Attack"
        />
      </Form.Item>
      <Form.Item label="Health">
        <Input
          type="number"
          value={health}
          onChange={(e) => setHealth(Number(e.target.value))}
          placeholder="Enemy Health"
        />
      </Form.Item>
      <Form.Item label="Image">
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enemy Image"
        />
        {imageUrl ? (
          <img width="250" height="250" src={imageUrl} alt="enemy view" />
        ) : null}
      </Form.Item>
      <Form.Item label="Select Resource for Reward:">
        <Select
          mode="multiple"
          placeholder="Resource for reward"
          value={selectedResourceType}
          onChange={setSelectedResourceType}
          optionLabelProp="label"
          labelInValue={false}
        >
          {coinBalances.length > 0 && coinBalances.map((coinBalance) => (
            <Option
              value={coinBalance.coin_type}
              key={coinBalance.coin_type}
              label={<span>{coinBalance.coin_type.split("::")[2]}</span>}
            >
              <span>{coinBalance.coin_type.split("::")[2]}</span>
            </Option>
          ))}
        </Select>
        <span className="tip-text">*If user will win - he will be awarded this type of resource</span>
      </Form.Item>
      <Form.Item label={`Reward Amount ${selectedResourceType.length > 1 ? 1 : ""}`}>
        <Input
          type="number"
          value={rewardCoin1Amount}
          onChange={(e) => setRewardCoin1Amount(Number(e.target.value))}
          placeholder="Reward that user gonna get for win"
        />
      </Form.Item>
      {selectedResourceType.length > 1 && (
        <Form.Item label="Reward Amount 2">
          <Input
            type="number"
            value={rewardCoin2Amount}
            onChange={(e) => setRewardCoin2Amount(Number(e.target.value))}
            placeholder="Reward that user gonna get for win"
          />
        </Form.Item>
      )}
      <Form.Item className="create-contract-button">
        <Button onClick={onCreateEnemy} type="primary">Create Enemy</Button>
      </Form.Item>
    </Form>
  )
}

export default CreateEnemyLevelForm