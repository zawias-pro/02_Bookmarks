import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/Button/Button.tsx'
import { Modal } from '../../components/Modal/Modal.tsx'
import { useAppStore } from '../../store/appStore.ts'
import { ThemeToggle } from '../../theming/ThemeToggle/ThemeToggle.tsx'
import { reloadFavicons } from '../../sync/sync.ts'
import { UpdateNotice } from '../UpdateNotice/UpdateNotice.tsx'
import styles from './SettingsModal.module.css'

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const authUser = useAppStore((state) => state.authUser)
  const [isLoadingIcons, setIsLoadingIcons] = useState(false)

  const loadIcons = async () => {
    setIsLoadingIcons(true)
    try {
      const count = await reloadFavicons()
      toast.success(`Reloaded ${count} bookmark icon(s).`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load bookmark icons.')
    } finally {
      setIsLoadingIcons(false)
    }
  }
  const iconButtonLabel = isLoadingIcons ? 'Reloading icons...' : 'Reload icons'

  return (
    <Modal titleId="settings-title" onClose={onClose}>
      <h2 id="settings-title">Settings</h2>
      <section className={styles.section}>
        <h3 className={styles.heading}>Appearance</h3>
        <ThemeToggle />
      </section>
      <section className={styles.section}>
        <h3 className={styles.heading}>Bookmark icons</h3>
        <p className={styles.description}>Refresh the saved icons for all bookmarks.</p>
        <Button onClick={() => void loadIcons()} disabled={authUser === null || isLoadingIcons}>
          {iconButtonLabel}
        </Button>
      </section>
      <section className={styles.section}>
        <h3 className={styles.heading}>App updates</h3>
        <UpdateNotice />
      </section>
    </Modal>
  )
}

export { SettingsModal }
