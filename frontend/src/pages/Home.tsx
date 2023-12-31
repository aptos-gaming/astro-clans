import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className='home-page'>
      <div className='buttons'>
        <Button type="primary" onClick={() => navigate('/play')}>
          Play in Testnet
        </Button>
        {/*
        <Button type="primary" onClick={() => navigate('/admin')}>
          Admin
        </Button>
        */}
      </div>
    </div>
  )
}

export default Home