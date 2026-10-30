let serviceWorkerRegistration: Promise<ServiceWorkerRegistration | undefined> | undefined

const appUpdateEvent = 'app-update-available'
const appVersion = '0.8.0'

const notifyUpdateAvailable = (version: string) => {
  window.dispatchEvent(new CustomEvent(appUpdateEvent, { detail: { version } }))
}

const registerAppServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return Promise.resolve(undefined)
  serviceWorkerRegistration ??= navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
    if (registration.waiting) notifyUpdateAvailable('newer')
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) notifyUpdateAvailable('newer')
      })
    })
    return registration
  }).catch((error: unknown) => {
    // Registering while offline rejects; a cached failure would disable updating for the whole session.
    serviceWorkerRegistration = undefined
    throw error
  })
  return serviceWorkerRegistration
}

const checkForUpdate = async () => {
  if (import.meta.env.DEV) return appVersion
  const registration = await registerAppServiceWorker()
  const response = await fetch(`/version.json?check=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(3_000) })
  if (!response.ok) throw new Error(`Version check failed with status ${response.status}.`)
  if (!response.headers.get('content-type')?.includes('application/json')) return appVersion
  const payload = await response.json() as { version?: unknown }
  if (typeof payload.version !== 'string') throw new Error('Version response is invalid.')
  if (payload.version !== appVersion) notifyUpdateAvailable(payload.version)
  await registration?.update()
  return payload.version
}

const activatePendingWorker = async (registration: ServiceWorkerRegistration) => {
  const worker = registration.waiting ?? registration.installing
  if (!worker) return false
  const activated = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('The update did not activate in time.')), 10_000)
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout)
        resolve()
      }
      if (worker.state === 'redundant') {
        window.clearTimeout(timeout)
        reject(new Error('The update failed to activate.'))
      }
    })
  })
  worker.postMessage({ type: 'SKIP_WAITING' })
  await activated
  return true
}

// A stale bundle talks to a server that already ran newer migrations, so it must never render.
const reloadOutdatedApp = async () => {
  const registration = await registerAppServiceWorker()
  if (!registration) return
  if (await checkForUpdate() === appVersion) return
  if (await activatePendingWorker(registration)) window.location.reload()
}

const updateApp = async () => {
  const registration = await registerAppServiceWorker() ?? await navigator.serviceWorker.getRegistration()
  if (!registration) throw new Error('Service worker is not registered.')
  await registration.update()
  await activatePendingWorker(registration)
  window.location.reload()
}

export { appUpdateEvent, appVersion, checkForUpdate, reloadOutdatedApp, updateApp }
