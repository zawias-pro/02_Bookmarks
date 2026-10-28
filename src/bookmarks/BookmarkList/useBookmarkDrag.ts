import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { LocalBookmark } from '../../model/model.ts'

type DragState = { bookmark: LocalBookmark; target: number | null }

const slotAt = (x: number, y: number) => {
  const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot]')
  if (!cell || cell.dataset.occupied !== 'false') return null
  return Number(cell.dataset.slot)
}

const transformAt = (x: number, y: number) => `translate(${x}px, ${y}px) translate(-50%, -50%)`

const useBookmarkDrag = (onDrop: (bookmarkId: string, slot: number) => void) => {
  const [drag, setDrag] = useState<DragState | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  // Pointer position lives outside React state: a re-render per pointer move redraws every item.
  const positionRef = useRef({ x: 0, y: 0 })

  const moveGhost = (x: number, y: number) => {
    positionRef.current = { x, y }
    if (ghostRef.current) ghostRef.current.style.transform = transformAt(x, y)
  }

  const startDrag = (bookmark: LocalBookmark, event: ReactPointerEvent<HTMLElement>) => {
    const element = event.currentTarget
    const startX = event.clientX
    const startY = event.clientY
    let moved = false

    element.setPointerCapture(event.pointerId)

    const cleanup = () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', cleanup)
      window.removeEventListener('keydown', onKey)
      setDrag(null)
    }

    const onMove = (moveEvent: PointerEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return
      moved = true
      moveGhost(moveEvent.clientX, moveEvent.clientY)
      const target = slotAt(moveEvent.clientX, moveEvent.clientY)
      setDrag((current) => current && current.target === target ? current : { bookmark, target })
    }

    const onUp = (upEvent: PointerEvent) => {
      cleanup()
      if (!moved) return
      // Swallow the click that ends this drag, but never the next unrelated one.
      const disarm = () => {
        window.removeEventListener('click', suppressClick, true)
        window.removeEventListener('pointerdown', disarm, true)
      }
      const suppressClick = (clickEvent: Event) => {
        clickEvent.preventDefault()
        clickEvent.stopPropagation()
        disarm()
      }
      window.addEventListener('click', suppressClick, true)
      window.addEventListener('pointerdown', disarm, true)
      const slot = slotAt(upEvent.clientX, upEvent.clientY)
      if (slot !== null) onDrop(bookmark.id, slot)
    }

    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') cleanup()
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', cleanup)
    window.addEventListener('keydown', onKey)
  }

  return { drag, startDrag, ghostRef, positionRef }
}

export { useBookmarkDrag, transformAt }
