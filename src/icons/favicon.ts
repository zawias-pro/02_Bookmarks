import { iconCandidates, pickDeclaredIcon } from './declared.ts'

const requestTimeoutMs = 4000
const iconCdnHost = 'https://icon.horse/icon'

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
  try {
    const response = await fetch(url, { mode: 'cors', signal: timeoutSignal() })
    if (!response.ok) return undefined
    const blob = await response.blob()
    // A single-page app answers a missing favicon with its HTML shell.
    if (blob.type && !blob.type.startsWith('image/')) return undefined
    return blob
  } catch {
    return undefined
  }
}

const fetchIconBytes = async (url: string) => {
  const blob = await fetchIconBlob(url)
  return blob ? await readBlob(blob) : undefined
}

// icon.horse answers an unknown host with a generated letter tile, which is opaque down to
// its corners; a real icon keeps them transparent. Bytes that do not decode are as useless.
// shortcut: a genuine full-bleed square icon is dropped too, refresh by uploading it.
const isUnusableCdnIcon = async (blob: Blob) => {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    return true
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Cannot inspect the icon because the canvas is unavailable.')
  context.drawImage(bitmap, 0, 0)
  return context.getImageData(0, 0, 1, 1).data[3] === 255
}

const firstIcon = async (urls: string[]) => {
  const icons = await Promise.all(urls.map(fetchIconBytes))
  return icons.find((icon) => icon !== undefined)
}

const declaredIcons = async (link: string) => {
  try {
    const response = await fetch(link, { mode: 'cors', signal: timeoutSignal() })
    if (!response.ok) return []
    return pickDeclaredIcon((await response.text()).slice(0, 200_000), link)
  } catch {
    return []
  }
}

// A site that declares <link rel="icon"> names the best icon; sites behind an auth proxy
// rarely allow reading the page, so probing the usual paths covers the rest.
const siteIcon = async (link: string) => {
  const [candidate, declared] = await Promise.all([
    firstIcon(iconCandidates(link)),
    declaredIcons(link).then(firstIcon),
  ])
  return declared ?? candidate
}

// Unknown hosts answer a generated tile, so the CDN never supplies a made-up icon.
const cdnIcon = async (link: string) => {
  const hostname = new URL(link).hostname
  const blob = await fetchIconBlob(`${iconCdnHost}/${hostname}`)
  if (!blob || await isUnusableCdnIcon(blob)) return undefined
  return await readBlob(blob)
}

const resolveFavicon = async (link: string) => await siteIcon(link) ?? await cdnIcon(link)

export { dataUrlToFile, fetchIconBytes, readBlob, resolveFavicon }
