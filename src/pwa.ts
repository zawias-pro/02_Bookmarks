let serviceWorkerRegistration: ServiceWorkerRegistration | undefined

const appUpdateEvent = 'app-update-available'
const appVersion = import.meta.env.VITE_APP_VERSION || 'development'

const notifyUpdateAvailable = (version: string) => {
  window.dispatchEvent(new CustomEvent(appUpdateEvent, { detail: { version } }))
}

const checkForUpdate = async () => {
  const response = await fetch(`/version.json?check=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Version check failed with status ${response.status}.`)
  if (!response.headers.get('content-type')?.includes('application/json')) return appVersion
  const payload = await response.json() as { version?: unknown }
  if (typeof payload.version !== 'string') throw new Error('Version response is invalid.')
  if (payload.version !== appVersion) notifyUpdateAvailable(payload.version)
  await serviceWorkerRegistration?.update()
  return payload.version
}

const registerAppServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      serviceWorkerRegistration = registration
      if (registration.waiting) notifyUpdateAvailable('newer')
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) notifyUpdateAvailable('newer')
        })
      })
      return registration.update()
    })
  })
}

const updateApp = () => {
  serviceWorkerRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  window.location.reload()
}

export { appUpdateEvent, appVersion, checkForUpdate, registerAppServiceWorker, updateApp }
