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
  rewardCoinType: string;
}

const StakePlanetModal = ({
  unclaimedReward, onHide, onStakeToken, onUnstakeToken, onClaimReward, onLevelUpgrade, rewardCoinType,
}: StakePlanetModalProps) => {
  const { selectedToken } = useSelectedToken()

  return (
    <Modal
      title="Upgradable Staking Actions"
      open={!!selectedToken}
      footer={null}
      onCancel={onHide}
    >
      <div className="margin-top-48">
        <Button
          type="primary"
          className="margin-right-16"
          onClick={() => selectedToken && onStakeToken()}
          disabled={!selectedToken?.amount || !!unclaimedReward}
        >
          Stake
        </Button>
        <Button
          type="primary"
          className="margin-right-16"
          onClick={() => selectedToken && onUnstakeToken()}
          disabled={!unclaimedReward}
        >
          Unstake
        </Button>
        <Button
          type="primary"
          className="margin-right-16"
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
        Unclaimed reward: <span>{unclaimedReward} {rewardCoinType ? rewardCoinType.split('::')[2] : ''}</span>
        <br />
        <pre>Upgrade cost: Level * 100 gasolineium</pre>
      </p>
    </Modal>
  )
}

export default StakePlanetModal