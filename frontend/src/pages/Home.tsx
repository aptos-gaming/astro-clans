import React from 'react'
import { useNavigate } from 'react-router-dom';

import { Button } from 'antd'

const Home = () => {
  let navigate = useNavigate();

  return (
    <div className='homePage'>
      <div className='buttons'>
        <Button type="primary" onClick={() => navigate('/play')}>
          Player
        </Button>
        <Button type="primary" onClick={() => navigate('/admin')}>
          Admin
        </Button>
      </div>
    </div>
  )
}

export default Home