import { createContext, useState, useEffect, type ReactNode } from 'react'

export interface NetworkState {
  isOnline: boolean
}

export const NetworkContext = createContext<NetworkState>({ isOnline: true })

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  )
}
