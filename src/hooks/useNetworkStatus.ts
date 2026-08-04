import { useContext } from 'react'
import { NetworkContext } from '../context/NetworkContext'

export function useNetworkStatus() {
  return useContext(NetworkContext)
}
