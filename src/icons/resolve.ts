import { iconCandidates, pickDeclaredIcon } from './declared.ts'
import { readImage } from './image.ts'
import { probeIcon, proxyBlob } from './proxy.ts'

const reachTimeoutMs = 5_000
const pageTimeoutMs = 8_000
const probeTimeoutMs = 15_000

const signalFrom = (signal: AbortSignal | undefined, timeoutMs: number) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)

// A host this browser cannot reach (offline, VPN off) is skipped instead of costing a proxy round trip.
const isReachable = async (link: string, signal?: AbortSignal) => {
  try {
    await fetch(iconCandidates(link)[0], { mode: 'no-cors', cache: 'no-store', signal: signalFrom(signal, reachTimeoutMs) })
    return true
  } catch {
    return false
  }
}

const declaredIcons = async (link: string, signal?: AbortSignal) => {
  try {
    const blob = await proxyBlob(link, signalFrom(signal, pageTimeoutMs))
    return blob ? pickDeclaredIcon((await blob.text()).slice(0, 200_000), link) : []
  } catch {
    return []
  }
}

// A site that declares <link rel="icon"> names its best icon; the usual paths cover sites that do not.
const resolveIcon = async (link: string, signal?: AbortSignal) => {
  if (!await isReachable(link, signal)) return undefined
  const urls = [...await declaredIcons(link, signal), ...iconCandidates(link)].filter((url) => /^https?:/i.test(url))
  // A probe that times out or breaks mid-body leaves this site without an icon; other icons still load.
  const blob = await probeIcon(urls, signalFrom(signal, probeTimeoutMs)).catch(() => undefined)
  if (!blob) return undefined
  try {
    return await readImage(blob)
  } catch {
    // The server streamed bytes the browser refuses to draw; this site has no usable icon.
    return undefined
  }
}

export { resolveIcon }
