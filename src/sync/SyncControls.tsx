import { useState } from 'react'
import { pullBookmarks, pushBookmarks } from './sync.ts'
import { useAppStore } from '../store/appStore.ts'
import { pb } from '../persistence/pocketbase.ts'

const SyncControls = () => {
  const [syncMessage, setSyncMessage] = useState('')
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen)
  const authUser = useAppStore((state) => state.authUser)
  const syncEnabled = authUser !== null

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string) => {
    try {
      const counts = await action()
      setSyncMessage(`${verb} ${counts.bookmarks} bookmarks, ${counts.categories} categories`)
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sync failed.')
    }
  }

  if(!syncEnabled) {
    return (
      <div>
        Changes not synced.
        <button type="button" onClick={() => setAuthFormOpen(true)}>
          Enable sync
        </button>
      </div>
    )
  }

  return (
    <div>
       Sync enabled as {authUser.username || authUser.email}
       <button type="button" onClick={() => pb.authStore.clear()}>
         Sign out
       </button>
      <button type="button" onClick={() => void sync(pullBookmarks, 'Pulled')} disabled={!syncEnabled}>Pull</button>
      <button type="button" onClick={() => void sync(pushBookmarks, 'Pushed')} disabled={!syncEnabled}>Push</button>
      {syncMessage && <p>{syncMessage}</p>}
    </div>
  )
}

export { SyncControls }
