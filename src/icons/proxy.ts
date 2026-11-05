import { pb } from '../persistence/pocketbase.ts'

const iconProxyUrl = (url: string) => `${pb.baseURL}/api/bookmarks/icon-proxy?url=${encodeURIComponent(url)}`
const iconProbeUrl = `${pb.baseURL}/api/bookmarks/icon-probe`

// Both routes live in pb_hooks: a missing session answers 401.
const authHeaders = () => ({ Authorization: pb.authStore.token })

// One call for the page HTML, so the declared icons can be read in the browser.
const proxyBlob = async (url: string, signal: AbortSignal) => {
  const response = await fetch(iconProxyUrl(url), { headers: authHeaders(), signal })
  if (!response.ok) return undefined
  return await response.blob()
}

// The server tries the URLs in order and streams the first image, so a bookmark costs one request.
const probeIcon = async (urls: string[], signal: AbortSignal) => {
  const response = await fetch(iconProbeUrl, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
    signal,
  })
  if (!response.ok) return undefined
  return await response.blob()
}

export { probeIcon, proxyBlob }
