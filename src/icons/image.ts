import { withSvgNamespace } from './svg.ts'

const maxIconSize = 256
// Mirrors the favicon and image file fields in pb_schema.json; the server sniffs bytes, so anything
// outside this list is refused on upload and must be rasterised here.
const storedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon']
const maxStoredLength = 5242880

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

const loadImage = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.addEventListener('load', () => resolve(image))
  image.addEventListener('error', () => reject(new Error('The icon could not be decoded as an image.')))
  image.src = dataUrl
})

// Bytes the browser cannot decode are an error page, not an icon, so they never reach the store.
const readImage = async (blob: Blob) => {
  if (blob.type && !blob.type.startsWith('image/')) throw new Error('The URL did not return an image.')
  const dataUrl = withSvgNamespace(await readBlob(blob))
  await loadImage(dataUrl)
  const type = (blob.type || '').split(';')[0].trim()
  return storedTypes.includes(type) && dataUrl.length <= maxStoredLength ? dataUrl : await transcodeIcon(dataUrl)
}

const dataUrlToFile = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = blob.type.split('/')[1]?.replace('svg+xml', 'svg') || 'png'
  return new File([blob], `favicon.${extension}`, { type: blob.type })
}

// PocketBase sniffs bytes, so a type it refuses (avif, bmp, a broken svg) is rasterised once, not lost.
const transcodeIcon = async (dataUrl: string) => {
  const image = await loadImage(dataUrl)
  const longest = Math.max(image.naturalWidth, image.naturalHeight)
  if (longest === 0) throw new Error('The icon has no size.')
  const scale = Math.min(1, maxIconSize / longest)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The browser could not draw the icon.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export { dataUrlToFile, readImage, transcodeIcon }
