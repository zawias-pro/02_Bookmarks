import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './core/App.tsx'
import { NetworkProvider } from './pwa/NetworkContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkProvider>
      <App />
    </NetworkProvider>
  </StrictMode>,
)
