import { pb } from '../persistence/pocketbase.ts'

const iconProxyUrl = (url: string) => `${pb.baseURL}/api/bookmarks/icon-proxy?url=${encodeURIComponent(url)}`

// Relies on the PocketBase route in pb_hooks/icon-proxy.pb.js: a missing session answers 401.
const proxyBlob = async (url: string, signal: AbortSignal) => {
  const response = await fetch(iconProxyUrl(url), { headers: { Authorization: pb.authStore.token }, signal })
  if (!response.ok) return undefined
  return await response.blob()
}

export { iconProxyUrl, proxyBlob }
