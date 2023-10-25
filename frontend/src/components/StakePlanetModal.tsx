import React from 'react'
import { Button, Modal } from 'antd'

import useSelectedToken from '../context/useSelectedToken';

interface StakePlanetModalProps {
  unclaimedReward: number;
  onStakeToken: () => Promise<void>;
  onUnstakeToken: () => Promise<void>;
  onClaimReward: () => Promise<void>;
  onLevelUpgrade: () => Promise<void>;
  onHide: () => void;
}

const StakePlanetModal = ({
  unclaimedReward, onHide, onStakeToken, onUnstakeToken, onClaimReward, onLevelUpgrade,
}: StakePlanetModalProps) => {
  const { selectedToken } = useSelectedToken()

  return (
    <Modal
      title="Upgradable Staking Actions"
      open={!!selectedToken}
      footer={null}
      onCancel={onHide}
    >
      <div style={{ marginTop: '3rem' }}>
        <Button
          type="primary"
          style={{ marginRight: '1rem'}}
          onClick={() => selectedToken && onStakeToken()}
          disabled={!selectedToken?.amount || !!unclaimedReward}
        >
          Stake
        </Button>
        <Button
          type="primary"
          style={{ marginRight: '1rem'}}
          onClick={() => selectedToken && onUnstakeToken()}
          disabled={!unclaimedReward}
        >
          Unstake
        </Button>
        <Button
          type="primary"
          style={{ marginRight: '1rem'}}
          onClick={() => selectedToken && onClaimReward()}
          disabled={!unclaimedReward}
        >
          Claim
        </Button>
        <Button
          type="primary"
          onClick={() => selectedToken && onLevelUpgrade()}
          disabled={!!unclaimedReward}
        >
          Upgrade
        </Button>
      </div>
      <p className="unclaimed-reward-text">
        Unclaimed reward: <span style={{ color: 'black', fontWeight: 'bold', fontSize: '1.2rem' }}>{unclaimedReward}</span>
      </p>
    </Modal>
  )
}

export default StakePlanetModal