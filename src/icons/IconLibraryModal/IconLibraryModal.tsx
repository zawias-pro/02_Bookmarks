import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Button } from '../../components/Button/Button.tsx'
import { Modal } from '../../components/Modal/Modal.tsx'
import { readBlob } from '../favicon.ts'
import { addIcon, deleteIcon, syncIcons } from '../library.ts'
import { db } from '../../persistence/database.ts'
import type { LocalIcon } from '../../model/model.ts'
import styles from './IconLibraryModal.module.css'

const IconLibraryModal = ({ onClose, onSelect }: { onClose: () => void; onSelect: (dataUrl: string) => void }) => {
  const icons = useLiveQuery(() => db.icons.orderBy('name').toArray(), []) ?? []
  const [name, setName] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Offline, the cached library stays usable.
    syncIcons().catch(() => undefined)
  }, [])

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
    await addIcon(name.trim() || file.name, dataUrl)
    setName('')
  }

  const remove = async (icon: LocalIcon) => {
    if (!window.confirm(`Delete icon "${icon.name}" from the library?`)) return
    await deleteIcon(icon.id)
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void run(() => upload(file), 'Could not add the icon.')
  }

  return (
    <Modal titleId="icon-library-title" onClose={onClose}>
      <h2 id="icon-library-title">Icon library</h2>
      <div className={styles.upload}>
        <input aria-label="Icon name" placeholder="Icon name" value={name} onChange={(event) => setName(event.target.value)} />
        <Button disabled={isBusy} onClick={() => fileInputRef.current?.click()}>Add icon</Button>
        <input className={styles.fileInput} ref={fileInputRef} type="file" accept="image/*" aria-label="Choose an icon file" onChange={handleFile} />
      </div>
      {icons.length === 0
        ? <p className={styles.empty}>No saved icons yet. Add one from a file, or upload directly on a bookmark.</p>
        : (
          <ul className={styles.grid}>
            {icons.map((icon) => (
              <li className={styles.item} key={icon.id}>
                <button className={styles.pick} type="button" onClick={() => onSelect(icon.dataUrl)} disabled={isBusy}>
                  <img src={icon.dataUrl} alt="" aria-hidden draggable={false} />
                  <span className={styles.name}>{icon.name}</span>
                </button>
                <button className={styles.remove} type="button" aria-label={`Delete icon ${icon.name}`} disabled={isBusy} onClick={() => void run(() => remove(icon), 'Could not delete the icon.')}>×</button>
              </li>
            ))}
          </ul>
        )}
    </Modal>
  )
}

export { IconLibraryModal }
