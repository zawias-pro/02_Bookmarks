import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/Button/Button.tsx'
import { Modal } from '../../components/Modal/Modal.tsx'
import type { IconReloadProgress } from '../../sync/sync.ts'
import { ThemeToggle } from '../../theming/ThemeToggle/ThemeToggle.tsx'
import { reloadFavicons } from '../../sync/sync.ts'
import { UpdateNotice } from '../UpdateNotice/UpdateNotice.tsx'
import styles from './SettingsModal.module.css'

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [progress, setProgress] = useState<IconReloadProgress | null>(null)

  const loadIcons = async () => {
    try {
      const { reloaded, skipped } = await reloadFavicons(setProgress)
      toast.success(`Reloaded ${reloaded} icon(s)${skipped > 0 ? `, kept ${skipped} custom` : ''}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load bookmark icons.')
    } finally {
      setProgress(null)
    }
  }
  const iconButtonLabel = progress ? `Reloading icons... ${progress.done} / ${progress.total}` : 'Reload icons'

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
        <Button onClick={() => void loadIcons()} disabled={progress !== null}>
          {iconButtonLabel}
        </Button>
        {progress && <progress className={styles.progress} value={progress.done} max={progress.total} />}
      </section>
      <section className={styles.section}>
        <h3 className={styles.heading}>App updates</h3>
        <UpdateNotice />
      </section>
    </Modal>
  )
}

export { SettingsModal }
