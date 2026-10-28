import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './core/App/App.tsx'
import { reloadOutdatedApp } from './pwa.ts'

const start = async () => {
  try {
    await reloadOutdatedApp()
  } catch (error) {
    // A failed check must not hide the local-first app, but it must not vanish either.
    console.warn('App update check failed.', error)
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
