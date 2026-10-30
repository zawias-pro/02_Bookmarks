const candidatePaths = ['/favicon.ico', '/favicon.png', '/favicon.svg', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png']

const iconCandidates = (link: string) => {
  const origin = new URL(link).origin
  return candidatePaths.map((path) => `${origin}${path}`)
}

const attribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3]
}

const declaredSize = (tag: string) => {
  const width = attribute(tag, 'sizes')?.match(/(\d+)/)
  if (width) return Number(width[1])
  return attribute(tag, 'type')?.includes('svg') ? 512 : 0
}

const pickDeclaredIcon = (html: string, baseUrl: string) => (html.match(/<link\b[^>]*>/gi) ?? [])
  .flatMap((tag) => {
    const rel = attribute(tag, 'rel') ?? ''
    const href = attribute(tag, 'href')
    if (!href || !/icon/i.test(rel) || /mask-icon/i.test(rel)) return []
    try {
      return [{ href: new URL(href, baseUrl).href, size: declaredSize(tag) }]
    } catch {
      return []
    }
  })
  .sort((left, right) => right.size - left.size)
  .map((icon) => icon.href)

export { iconCandidates, pickDeclaredIcon }
