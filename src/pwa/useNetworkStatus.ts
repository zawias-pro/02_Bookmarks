import { useContext } from 'react'
import { NetworkContext } from './NetworkContext.tsx'

const useNetworkStatus = () => {
  return useContext(NetworkContext)
}

export { useNetworkStatus }
