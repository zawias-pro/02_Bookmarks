import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/Button/Button.tsx'
import { readBlob } from '../../icons/favicon.ts'
import { addIcon } from '../../icons/library.ts'
import { IconLibraryModal } from '../../icons/IconLibraryModal/IconLibraryModal.tsx'
import { refreshBookmarkIcon, setBookmarkIcon } from '../../sync/sync.ts'
import type { LocalBookmark } from '../../model/model.ts'
import styles from './BookmarkIconField.module.css'

const BookmarkIconField = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const [isBusy, setIsBusy] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failure)
    } finally {
      setIsBusy(false)
    }
  }

  const upload = async (file: File) => {
    const dataUrl = await readBlob(file)
    await addIcon(bookmark.title, dataUrl)
    await setBookmarkIcon(bookmark.id, dataUrl)
  }

  const select = async (dataUrl: string) => {
    await setBookmarkIcon(bookmark.id, dataUrl)
    setIsLibraryOpen(false)
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void run(() => upload(file), 'Could not save the icon.')
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>Icon</span>
      <div className={styles.row}>
        <span className={styles.preview}>
          {bookmark.favicon
            ? <img src={bookmark.favicon} alt="" aria-hidden draggable={false} />
            : <span className={styles.placeholder} aria-hidden>{bookmark.title.slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className={styles.source}>{bookmark.iconSource === 'custom' ? 'Custom' : 'Auto'}</span>
        <Button variant="ghost" disabled={isBusy} onClick={() => void run(() => refreshBookmarkIcon(bookmark.id), 'Could not refresh the icon.')}>Refresh</Button>
        <Button variant="ghost" disabled={isBusy} onClick={() => fileInputRef.current?.click()}>Upload</Button>
        <Button variant="ghost" disabled={isBusy} onClick={() => setIsLibraryOpen(true)}>Pick</Button>
        <input className={styles.fileInput} ref={fileInputRef} type="file" accept="image/*" aria-label="Upload icon" onChange={handleFile} />
      </div>
      {isLibraryOpen
        ? <IconLibraryModal onClose={() => setIsLibraryOpen(false)} onSelect={(dataUrl) => void run(() => select(dataUrl), 'Could not set the icon.')} />
        : null}
    </div>
  )
}

export { BookmarkIconField }
