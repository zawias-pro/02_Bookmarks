import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './core/App/App.tsx'
import { reloadOutdatedApp } from './pwa.ts'

const start = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  // The update check never holds first paint: it renders, then reloads itself when the server is newer.
  void reloadOutdatedApp().catch((error: unknown) => {
    // A failed check must not hide the local-first app, but it must not vanish either.
    console.warn('App update check failed.', error)
  })
}

start()
