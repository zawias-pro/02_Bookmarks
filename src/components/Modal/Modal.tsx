import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

// Escape and the body lock belong to the topmost modal only, so a picker opened from a
// form does not close the form underneath it.
const modalStack: symbol[] = []

const Modal = ({
  titleId,
  onClose,
  children
}: {
  titleId: string
  onClose: () => void
  children: ReactNode
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const token = Symbol('modal')
    modalStack.push(token)
    const previousActiveElement = document.activeElement as HTMLElement | null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalStack.at(-1) === token) onCloseRef.current()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus()

    return () => {
      modalStack.splice(modalStack.indexOf(token), 1)
      if (modalStack.length === 0) document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [])

  return createPortal(
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button className={styles.close} type="button" aria-label="Close dialog" onClick={onClose}>Close</button>
        <div className={styles.card}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export { Modal }
