// Seeds a throwaway PocketBase account with categories and bookmarks, for local UI work.
// The app is offline-first, so nothing here writes to IndexedDB: sign in to the printed account
// in a private window (fresh storage) and the first sync pulls this data in.
// `--clean` removes the account and, by cascade, everything it owns.

const baseUrl = process.env.SEED_PB_URL || 'http://127.0.0.1:8090'
const email = 'seed@02bookmarks.test'
const password = 'seed-data-password'

const request = async (path, options = {}, token) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}), ...options.headers },
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed with ${response.status}: ${body}`)
  return body ? JSON.parse(body) : undefined
}

const signIn = async () => {
  try {
    return await request('/api/collections/users/auth-with-password', {
      method: 'POST',
      body: JSON.stringify({ identity: email, password }),
    })
  } catch {
    return undefined
  }
}

const createUser = () => request('/api/collections/users/records', {
  method: 'POST',
  body: JSON.stringify({ email, password, passwordConfirm: password }),
})

const createRow = (collection, fields, token) => request(`/api/collections/${collection}/records`, {
  method: 'POST',
  body: JSON.stringify(fields),
}, token).then((record) => record.id)

const updateRow = (collection, id, fields, token) => request(`/api/collections/${collection}/records/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(fields),
}, token)

const categories = [
  { key: 'work', name: 'Work', order: 0 },
  { key: 'docs', name: 'Docs', order: 0, parent: 'work' },
  { key: 'servers', name: 'Servers', order: 1, parent: 'work' },
  { key: 'homelab', name: 'Homelab', order: 0, parent: 'servers' },
  { key: 'reading', name: 'Reading', order: 1 },
  { key: 'tools', name: 'Tools', order: 2 },
]

const bookmarks = [
  { title: 'GitHub', link: 'https://github.com', category: 'tools', order: 0 },
  { title: 'npm', link: 'https://www.npmjs.com', category: 'tools', order: 1 },
  { title: 'Vite', link: 'https://vitejs.dev', category: 'tools', order: 2 },
  { title: 'React', link: 'https://react.dev', category: 'tools', order: 3 },
  { title: 'Node.js', link: 'https://nodejs.org', category: 'docs', order: 0 },
  { title: 'MDN Web Docs', link: 'https://developer.mozilla.org', category: 'docs', order: 1 },
  { title: 'PocketBase docs', link: 'https://pocketbase.io/docs', category: 'docs', order: 2 },
  { title: 'Dexie.js', link: 'https://dexie.org', category: 'docs', order: 3 },
  { title: 'Hacker News', link: 'https://news.ycombinator.com', category: 'reading', order: 0 },
  { title: 'Lobsters', link: 'https://lobste.rs', category: 'reading', order: 1 },
  { title: 'Wikipedia', link: 'https://www.wikipedia.org', category: 'reading', order: 2 },
  { title: 'Stack Overflow', link: 'https://stackoverflow.com', category: 'work', order: 0 },
  { title: 'NetBird', link: 'https://netbird.io', category: 'servers', order: 0 },
  { title: 'PfSense router', link: 'http://192.168.1.1/', category: 'homelab', order: 0 },
  { title: 'NAS', link: 'http://nas.local/', category: 'homelab', order: 1 },
  { title: 'Proxmox', link: 'https://proxmox.local:8006/', category: 'homelab', order: 2 },
  { title: 'Broken icon host', link: 'https://example.invalid/', category: 'reading', order: 3 },
  { title: 'Uncategorized example', link: 'https://example.com', category: null, order: 0 },
]

// Explicit board slots, including a gap after the second bookmark so the grid must not compact.
const boardLayout = { tools: [0, 1, 4, 5] }

const clean = async () => {
  const auth = await signIn()
  if (!auth) {
    console.log(`no seed account at ${baseUrl}, nothing to clean`)
    return
  }
  await request(`/api/collections/users/records/${auth.record.id}`, { method: 'DELETE' }, auth.token)
  console.log(`deleted ${email} and every record it owned`)
}

const seed = async () => {
  await clean()
  await createUser()
  const { token, record } = await signIn()
  console.log(`signed in as ${email} (${record.id})`)

  const categoryIds = new Map()
  for (const category of categories) {
    categoryIds.set(category.key, await createRow('categories', {
      name: category.name,
      order: category.order,
      parent: category.parent ? categoryIds.get(category.parent) : '',
      user: record.id,
    }, token))
  }

  const bookmarkIds = new Map()
  for (const bookmark of bookmarks) {
    bookmarkIds.set(bookmark.title, await createRow('bookmarks', {
      title: bookmark.title,
      link: bookmark.link,
      order: bookmark.order,
      category: bookmark.category ? categoryIds.get(bookmark.category) : '',
      iconSource: 'auto',
      user: record.id,
    }, token))
  }

  for (const [categoryKey, slots] of Object.entries(boardLayout)) {
    const rows = bookmarks.filter((bookmark) => bookmark.category === categoryKey)
    const positions = Object.fromEntries(rows.map((bookmark, index) => [bookmarkIds.get(bookmark.title), slots[index]]))
    await updateRow('categories', categoryIds.get(categoryKey), { positions }, token)
  }

  console.log(`seeded ${categories.length} categories and ${bookmarks.length} bookmarks into ${baseUrl}`)
  console.log('open a private window at the dev server, sign in with:')
  console.log(`  email:    ${email}`)
  console.log(`  password: ${password}`)
  console.log('cleanup: npm run seed:dev -- --clean')
}

if (process.argv.includes('--clean')) await clean()
else await seed()
