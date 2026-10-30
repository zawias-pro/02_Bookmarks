import type { RecordModel } from 'pocketbase'
import { db } from '../persistence/database.ts'
import { pb } from '../persistence/pocketbase.ts'
import { dataUrlToFile, fetchIconBytes } from './favicon.ts'
import type { LocalIcon } from '../model/model.ts'

// The library is server-owned: reading works offline from the cache, writing needs a connection.
// shortcut: adding an icon offline fails with a message, upgrade to the outbox only if that hurts.
type RemoteIcon = RecordModel & { name: string; image: string }

const signedInUserId = () => {
  if (!pb.authStore.isValid || !pb.authStore.record) throw new Error('Sign in to PocketBase before using the icon library.')
  return pb.authStore.record.id
}

const downloadIcon = async (record: RemoteIcon) => {
  const dataUrl = await fetchIconBytes(pb.files.getURL(record, record.image))
  if (!dataUrl) throw new Error(`Could not download icon "${record.name}".`)
  return dataUrl
}

const syncIcons = async () => {
  const userId = signedInUserId()
  const records = await pb.collection<RemoteIcon>('icons').getFullList({ filter: `user = "${userId}"`, sort: 'name' })
  const cached = new Map((await db.icons.toArray()).map((icon) => [icon.id, icon]))
  const icons: LocalIcon[] = []
  for (const record of records) {
    const existing = cached.get(record.id)
    const dataUrl = existing && existing.updatedAt === record.updated ? existing.dataUrl : await downloadIcon(record)
    icons.push({ id: record.id, name: record.name, dataUrl, updatedAt: record.updated })
  }
  await db.transaction('rw', db.icons, async () => {
    await db.icons.clear()
    await db.icons.bulkPut(icons)
  })
  return icons
}

const addIcon = async (name: string, dataUrl: string) => {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Icon name cannot be empty.')
  const user = signedInUserId()
  if (navigator.onLine === false) throw new Error('Connect to the internet before adding an icon.')
  const data = new FormData()
  data.set('name', trimmed)
  data.set('user', user)
  data.set('image', await dataUrlToFile(dataUrl))
  const record = await pb.collection<RemoteIcon>('icons').create(data)
  const icon: LocalIcon = { id: record.id, name: record.name, dataUrl, updatedAt: record.updated }
  await db.icons.put(icon)
  return icon
}

const deleteIcon = async (id: string) => {
  signedInUserId()
  if (navigator.onLine === false) throw new Error('Connect to the internet before deleting an icon.')
  await pb.collection('icons').delete(id)
  await db.icons.delete(id)
}

export { addIcon, deleteIcon, syncIcons }
