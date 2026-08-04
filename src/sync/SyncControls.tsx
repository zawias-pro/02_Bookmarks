import { useState } from 'react'
import { pullBookmarks, pushBookmarks } from './sync.ts'
import { useAppStore } from '../store/appStore.ts'

const SyncControls = () => {
  const [syncMessage, setSyncMessage] = useState('')
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen)
  const syncEnabled = useAppStore((state) => state.isSyncEnabled)

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string) => {
    try {
      const counts = await action()
      setSyncMessage(`${verb} ${counts.bookmarks} bookmarks, ${counts.categories} categories`)
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sync failed.')
    }
  }

  return (
    <div className="badge-container">
      <button type="button" onClick={() => setAuthFormOpen(true)}>
        {syncEnabled ? 'Sync enabled' : 'Enable sync'}
      </button>
      <button type="button" onClick={() => void sync(pullBookmarks, 'Pulled')} disabled={!syncEnabled}>Force pull</button>
      <button type="button" onClick={() => void sync(pushBookmarks, 'Pushed')} disabled={!syncEnabled}>Force push</button>
      {syncMessage && <span className="badge">{syncMessage}</span>}
    </div>
  )
}

export { SyncControls }
