import { pullBookmarks, pushBookmarks } from './sync.ts'
import { useAppStore } from '../store/appStore.ts'
import { pb } from '../persistence/pocketbase.ts'
import { toast } from 'sonner'

const SyncControls = () => {
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen)
  const authUser = useAppStore((state) => state.authUser)
  const syncEnabled = authUser !== null

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string, confirmation: string) => {
    if (!window.confirm(confirmation)) return
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
      <br/>
       <button type="button" onClick={() => { pb.authStore.clear(); toast.success('Signed out') }}>
         Sign out
       </button>
       <button type="button" onClick={() => void sync(pullBookmarks, 'Pulled', 'Pull from the server? This will replace all local bookmarks and categories.')} disabled={!syncEnabled}>Pull</button>
       <button type="button" onClick={() => void sync(pushBookmarks, 'Pushed', 'Push to the server? This will replace all remote bookmarks and categories.')} disabled={!syncEnabled}>Push</button>
    </div>
  )
}

export { SyncControls }
