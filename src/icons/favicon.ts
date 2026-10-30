import { iconCandidates, pickDeclaredIcon } from './declared.ts'
import { proxyBlob } from './proxy.ts'

const requestTimeoutMs = 8000

const readBlob = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    if (typeof reader.result !== 'string') {
      reject(new Error('Could not read the icon file.'))
      return
    }
    resolve(reader.result)
  })
  reader.addEventListener('error', () => reject(new Error('Could not read the icon file.')))
  reader.readAsDataURL(blob)
})

const dataUrlToFile = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = blob.type.split('/')[1]?.replace('svg+xml', 'svg') || 'png'
  return new File([blob], `favicon.${extension}`, { type: blob.type })
}

const timeoutSignal = () => AbortSignal.timeout(requestTimeoutMs)

const fetchIconBlob = async (url: string) => {
  const blob = await proxyBlob(url, timeoutSignal())
  if (!blob) return undefined
  // A single-page app answers a missing favicon with its HTML shell.
  if (blob.type && !blob.type.startsWith('image/')) return undefined
  return blob
}

const fetchIconBytes = async (url: string) => {
  const blob = await fetchIconBlob(url)
  return blob ? await readBlob(blob) : undefined
}

const firstIcon = async (urls: string[]) => {
  const icons = await Promise.all(urls.map(fetchIconBytes))
  return icons.find((icon) => icon !== undefined)
}

const declaredIcons = async (link: string) => {
  try {
    const blob = await proxyBlob(link, timeoutSignal())
    return blob ? pickDeclaredIcon((await blob.text()).slice(0, 200_000), link) : []
  } catch {
    return []
  }
}

// A site that declares <link rel="icon"> names the best icon; sites behind an auth proxy
// rarely allow reading the page, so probing the usual paths covers the rest.
const resolveFavicon = async (link: string) => {
  const [candidate, declared] = await Promise.all([
    firstIcon(iconCandidates(link)),
    declaredIcons(link).then(firstIcon),
  ])
  return declared ?? candidate
}

export { dataUrlToFile, fetchIconBytes, readBlob, resolveFavicon }
