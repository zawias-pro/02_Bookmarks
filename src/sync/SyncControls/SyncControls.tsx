import { pullBookmarks, pushBookmarks } from '../sync.ts'
import { useAppStore } from '../../store/appStore.ts'
import { pb } from '../../persistence/pocketbase.ts'
import { Button } from '../../components/Button/Button.tsx'
import { toast } from 'sonner'
import styles from './SyncControls.module.css'

const SyncControls = () => {
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)
  const authUser = useAppStore((state) => state.authUser)
  const isAuthChecked = useAppStore((state) => state.isAuthChecked)
  const syncEnabled = isAuthChecked && authUser !== null

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string, confirmation: string) => {
    if (!window.confirm(confirmation)) return
    try {
      const counts = await action()
      toast.success(`${verb} ${counts.bookmarks} bookmarks, ${counts.categories} categories`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed.')
    }
  }

  const pull = async () => {
    const counts = await pullBookmarks()
    setSelectedCategoryId(null)
    return counts
  }

  if (!isAuthChecked) {
    return <div className={styles.status}>Checking sign-in...</div>
  }

  if (!syncEnabled) {
    return (
      <div>
        <span className={styles.status}>Changes not synced.</span>
        <div className={styles.actions}>
          <Button onClick={() => setAuthFormOpen(true)}>Enable sync</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.user}>Sync enabled as {authUser.username || authUser.email}</div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => { pb.authStore.clear(); toast.success('Signed out') }}>Sign out</Button>
        <Button onClick={() => void sync(pull, 'Pulled', 'Pull from the server? This will replace all local bookmarks and categories.')} disabled={!syncEnabled}>Pull</Button>
        <Button onClick={() => void sync(pushBookmarks, 'Pushed', 'Push to the server? This will replace all remote bookmarks and categories.')} disabled={!syncEnabled}>Push</Button>
      </div>
    </div>
  )
}

export { SyncControls }
