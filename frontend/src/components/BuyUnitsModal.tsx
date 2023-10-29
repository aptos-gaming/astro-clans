import React, { useState } from 'react'
import { Row, Col, Button, Modal, Slider, InputNumber } from 'antd'

interface BuyUnitsModalProps {
  selectedContract: any;
  maxUnits: number;
  onCancel: () => void;
  onBuyUnits: (numberOfUnits: number) => void;
}

const BuyUnitsModal = ({ selectedContract, onCancel, maxUnits, onBuyUnits }: BuyUnitsModalProps) => {
  const [numberOfUnits, setNumberOfUnits] = useState(1)

  return (
    <Modal
      title={`Buy ${selectedContract?.unitName}'s`}
      open={!!selectedContract}
      footer={null}
      onCancel={onCancel}
    >
      <Row>
        <Col style={{width: '75%', marginRight: '1rem' }}>
          <Slider
            min={1}
            max={maxUnits}
            value={numberOfUnits}
            onChange={setNumberOfUnits}
            marks={{
              1: '1',
              [maxUnits]: maxUnits
            }}
            trackStyle={{ height: '5px', backgroundColor: '#1677ff' }}
          />
        </Col>
        <Col span={3}>
          <InputNumber value={numberOfUnits} onChange={(value) => setNumberOfUnits(Number(value))} />
        </Col>
      </Row>
      <p className="black-text">Total Cost: {numberOfUnits * selectedContract?.fixedPrice} {selectedContract?.resourceName}</p>
      <div className="buy-units-buttons">
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button style={{ marginLeft: '8px'}} type="primary" onClick={() => onBuyUnits(numberOfUnits)}>
          Buy
        </Button>
      </div>
    </Modal>
  )
}

export default BuyUnitsModal