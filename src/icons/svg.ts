const svgMime = 'image/svg+xml'
const svgNamespace = 'xmlns="http://www.w3.org/2000/svg"'

const isSvgDataUrl = (dataUrl: string) => dataUrl.startsWith(`data:${svgMime},`) || dataUrl.startsWith(`data:${svgMime};`)

// PocketBase sniffs stored bytes, and its SVG matcher requires xmlns on the root tag.
const addSvgNamespace = (markup: string) => {
  const root = /<svg\b[^>]*>/i.exec(markup)
  if (!root || /\bxmlns\s*=/.test(root[0])) return markup
  return markup.replace(root[0], root[0].replace(/<svg\b/i, `<svg ${svgNamespace}`))
}

const withSvgNamespace = (dataUrl: string) => {
  if (!isSvgDataUrl(dataUrl)) return dataUrl
  const comma = dataUrl.indexOf(',')
  const head = dataUrl.slice(0, comma)
  const base64 = head.endsWith(';base64')
  const payload = dataUrl.slice(comma + 1)
  const markup = base64 ? atob(payload) : decodeURIComponent(payload)
  const patched = addSvgNamespace(markup)
  if (patched === markup) return dataUrl
  return `${head},${base64 ? btoa(patched) : encodeURIComponent(patched)}`
}

export { addSvgNamespace, withSvgNamespace }
