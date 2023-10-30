import React, { useState } from "react"
import { Form, Input, Button, Select } from "antd"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { toast } from 'react-toastify'

import useCoinBalances from "../../context/useCoinBalances"
import { client } from '../../aptosClient'
import CONFIG from "../../config.json"

const { Option } = Select;

const layout = {
  labelCol: { span: 3 },
};

interface CreateUnitContractFormProps {
  unitsList: Array<any>;
  getContractsList: () => Promise<void>;
}

const CreateUnitContractForm = ({ unitsList, getContractsList }: CreateUnitContractFormProps) => {
  const { signAndSubmitTransaction } = useWallet()
  const { coinBalances } = useCoinBalances()
  const [form] = Form.useForm()
  
  const [fixedPrice, setFixedPrice] = useState<number>(50)
  const [selectedUnitId, setSelectedUnitId] = useState(null)
  const [selectedResourceType, setSelectedResourceType] = useState("")

  const onCreateContract = async () => {
    if (!fixedPrice || !selectedUnitId || !selectedResourceType) {
      alert("Missing required fields")
      return
    }

    const unitData = unitsList.find((unit) => unit.key === selectedUnitId)
    if (!unitData) {
      alert("Cannot find valid unit from UnitsList")
      return
    }

    const payload = {
      type: "entry_function_payload",
      function: `${CONFIG.pveModule}::${CONFIG.pvePackageName}::create_unit_contract`,
      // resource_type, unit_type
      type_arguments: [selectedResourceType, unitData.value.linked_coin_type],
      // unit_id: u64, fixed_price: u64
      arguments: [selectedUnitId, fixedPrice]
    }
    try {
      const tx = await signAndSubmitTransaction(payload)
      toast.promise(client.waitForTransactionWithResult(tx.hash), {
        pending: 'Creating new unit contract...',
        success: 'New contract created',
        error: 'Error during creating contract',
      })
      getContractsList()
    } catch (e) {
      console.log("ERROR during create unit contract pair tx")
      console.log(e)
    }
  }

  return (
    <Form form={form} className="create-unit-form" {...layout}>
      <Form.Item label="Fixed Price">
        <Input
          type="number"
          value={fixedPrice}
          onChange={(e) => setFixedPrice(Number(e.target.value))}
          placeholder="Price"
        />
      </Form.Item>
      <Form.Item label="Select Unit:">
        <Select
          placeholder="Unit"
          value={selectedUnitId}
          onChange={setSelectedUnitId}
          optionLabelProp="label"
          labelInValue={false}
        >
          {unitsList.length > 0 && unitsList.map((unitData) => (
            <Option
              value={unitData.key}
              key={unitData.key}
              label={<span>{unitData.value.name}</span>}
            >
              <span>{unitData.value.name} ❤️ {unitData.value.health} ⚔️ {unitData.value.attack}</span>
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Select Resource:">
        <Select
          placeholder="Resource to buy unit"
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
      </Form.Item>
      <Form.Item className="create-contract-button">
        <Button onClick={onCreateContract} type="primary">Create Contract</Button>
      </Form.Item>
    </Form>
  )
}

export default CreateUnitContractForm