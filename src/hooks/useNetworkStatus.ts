import { useContext } from 'react'
import { NetworkContext } from '../context/NetworkContext'

const useNetworkStatus = () => {
  return useContext(NetworkContext)
}

export { useNetworkStatus }
