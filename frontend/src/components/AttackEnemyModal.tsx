import React, { useState, useEffect } from 'react'
import { Row, Col, Button, Modal, Slider, InputNumber } from 'antd'
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useApolloClient } from '@apollo/client'
 
import useCoinBalances from '../context/useCoinBalances'
import { Unit } from '../types'
import { attackEnemy } from '../onChainUtils'

interface AttackEnemyModalProps {
  selectedEnemy: any;
  unitsList: Array<Unit>
  onCancel: () => void;
}

const Decimals = 8

const AttackEnemyModal = ({ selectedEnemy, unitsList, onCancel }: AttackEnemyModalProps) => {
  const [unitsForAttack, setUnitsForAttack] = useState<any>({})
  const { coinBalances } = useCoinBalances()
  const { signAndSubmitTransaction } = useWallet()
  const apolloClient = useApolloClient()

  useEffect(() => {
    if (!selectedEnemy) {
      setUnitsForAttack({})
    }
  }, [selectedEnemy])

  const getTotalValues = (): { health: number, attack: number } => {
    let totalAttack = 0
    let totalHealth = 0
    const unitsForAttackKeys = Object.keys(unitsForAttack)

    unitsForAttackKeys.forEach((unitKey: any) => {
      const unitData = unitsList.find((unit) => unit.key === String(unitKey))
      const numberOfUnits = unitsForAttack[unitKey] as any

      if (!numberOfUnits) return

      totalAttack += numberOfUnits?.split('-')[0] * Number(unitData?.value.attack)
      totalHealth += numberOfUnits?.split('-')[0] * Number(unitData?.value.health)
    })

    return {
      health: totalHealth,
      attack: totalAttack,
    }
  }

  return (
    <Modal
      title={`Attack ${selectedEnemy?.name}`}
      open={!!selectedEnemy}
      footer={null}
      onCancel={onCancel}
    >
      <>
        {unitsList.length === 0 ? (
          <span>You dont have any units, buy some and then attack</span>
        ): null}
        {unitsList.length > 0 ? unitsList.map((unit: Unit) => {
          const unitCoinType = unit.value.linked_coin_type
          const unitCoinData = coinBalances.find((coinBalance) => coinBalance.coin_type === unitCoinType)
          if (!unitCoinData) return
          const unitBalance = unitCoinData?.amount / 10 ** Decimals

          return (
            <div key={unit.key} className="unit-selection-slider">
              <span>{unit.value.name}</span>
              <Row>
                <Col style={{width: '75%', marginRight: '1rem' }}>
                  <Slider
                    min={0}
                    max={unitBalance}
                    value={unitsForAttack[unit.key]?.split("-")[0]}
                    onChange={(value) => setUnitsForAttack({ ...unitsForAttack, [unit.key]: `${value}-${unit.value.linked_coin_type}`})}
                    marks={{
                      0: '0',
                      [unitBalance]: unitBalance
                    }}
                    trackStyle={{ height: '5px', backgroundColor: '#1677ff' }}
                  />
                </Col>
                <Col span={3}>
                  <InputNumber
                    value={unitsForAttack[unit.key]?.split("-")[0]}
                    onChange={(value) => setUnitsForAttack({ ...unitsForAttack, [unit.key]: `${value}-${unit.value.linked_coin_type}`})}
                  />
                </Col>
              </Row>
            </div>
          )}
        ): null}
        <p className="black-text">Total Units: {Number(Object.values(unitsForAttack).reduce((acc: any, value: any) => acc + Number(value.split('-')[0]), 0))}</p>
        <p className="black-text">Total Attack: {getTotalValues().attack} (⚔️)</p>
        <p className="black-text">Total Health: {getTotalValues().health} (❤️)</p>
        <div className="buy-units-buttons">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={unitsForAttack.length === 0}
            style={{ marginLeft: '8px'}}
            onClick={() => attackEnemy(selectedEnemy, unitsForAttack, signAndSubmitTransaction, apolloClient)}
          >
            Attack
          </Button>
        </div>
      </>
    </Modal>
  )
}

export default AttackEnemyModal