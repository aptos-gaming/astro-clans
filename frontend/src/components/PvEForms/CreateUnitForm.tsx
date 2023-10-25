import React, { useState } from "react"
import { Form, Input, Button } from "antd"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { AptosClient } from "aptos"

import { Unit } from '../../types'
import CONFIG from "../../config.json"

const PackageName = "pve_battles"

const DevnetClientUrl = "https://fullnode.devnet.aptoslabs.com/v1"
const TestnetClientUrl = "https://fullnode.testnet.aptoslabs.com"
const client = new AptosClient(CONFIG.network === "devnet" ? DevnetClientUrl : TestnetClientUrl)

const layout = {
  labelCol: { span: 3 },
}

interface CreateUnitFormProps {
  unitsList: Array<Unit>,
  getUnitsList: () => void;
}

const CreateUnitForm = ({ unitsList, getUnitsList }: CreateUnitFormProps) => {
  const { signAndSubmitTransaction } = useWallet()
  const [form] = Form.useForm()
  
  const [name, setName] = useState<string>('Galactic Protector')
  const [symbol, setSymbol] = useState<string>('GPR')
  const [description, setDescription] = useState<string>('Galactic Protector Description')
  const [imageUrl, setImageUrl] = useState<string>('https://github.com/aptos-gaming/on-chain-pve-battles/blob/main/frontend/public/battleship.png?raw=true')

  const [attack, setAttack] = useState(10)
  const [health, setHealth] = useState(10)

  const onCreateUnitType = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::create_unit_type`,
      type_arguments: [],
      arguments: [String(unitsList.length + 1)]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
    } catch (e) {
      console.log("ERROR during create new unit special type")
      console.log(e)
    }
  }

  const onCreateUnit = async () => {
    if (!name || !description || !imageUrl || !attack || !health) {
      alert("Missing required fields")
      return
    }
    // admin should init type first and only then create new unit
    const coinType = `${CONFIG.pveModule}::coin${unitsList.length + 1}::T`

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${PackageName}::create_unit`,
      type_arguments: [coinType],
      arguments: [name, symbol, description, imageUrl, attack, health]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      await client.waitForTransactionWithResult(tx.hash)
      getUnitsList()
      setName('')
      setDescription('')
      setImageUrl('')
      setSymbol('')
    } catch (e) {
      console.log("ERROR during create new unit")
      console.log(e)
    }
  }

  return (
    <Form form={form} className="create-unit-form" {...layout}>
      <Form.Item label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Unit Name"
        />
      </Form.Item>
      <Form.Item label="Symbol">
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Unit Symbol (should be short)"
        />
      </Form.Item>
      <Form.Item label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Unit Short Description"
        />
      </Form.Item>
      <Form.Item label="Image Url">
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Unit image url"
        />
        {imageUrl && <img style={{ marginTop: "0.5rem"}} width="200px" height="200px" src={imageUrl} alt="unit" />}
      </Form.Item>
      <Form.Item label="Attack">
        <Input
          type="number"
          value={attack}
          onChange={(e) => setAttack(Number(e.target.value))}
          placeholder="Unit Attack"
        />
      </Form.Item>
      <Form.Item label="Health">
        <Input
          type="number"
          value={health}
          onChange={(e) => setHealth(Number(e.target.value))}
          placeholder="Unit Health"
        />
      </Form.Item>
      <Form.Item>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', flexDirection: 'row'}}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Button style={{ marginRight: '2rem' }} onClick={onCreateUnitType} type="primary">Init Unit Type</Button>
            <span className="tip-text">*init type before create unit</span>
          </div>
          <Button onClick={onCreateUnit} type="primary">Create Unit</Button>
        </div>
      </Form.Item>
    </Form>
  )
}

export default CreateUnitForm