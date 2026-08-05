import { pullBookmarks, pushBookmarks } from './sync.ts'
import { useAppStore } from '../store/appStore.ts'
import { pb } from '../persistence/pocketbase.ts'
import { toast } from 'sonner'

const SyncControls = () => {
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen)
  const authUser = useAppStore((state) => state.authUser)
  const syncEnabled = authUser !== null

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string) => {
    try {
      const counts = await action()
      toast.success(`${verb} ${counts.bookmarks} bookmarks, ${counts.categories} categories`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed.')
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
       <button type="button" onClick={() => { pb.authStore.clear(); toast.success('Signed out') }}>
         Sign out
       </button>
      <button type="button" onClick={() => void sync(pullBookmarks, 'Pulled')} disabled={!syncEnabled}>Pull</button>
      <button type="button" onClick={() => void sync(pushBookmarks, 'Pushed')} disabled={!syncEnabled}>Push</button>
    </div>
  )
}

export { SyncControls }
