import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type DragState<Target, Item> = { item: Item; target: Target | null }

const transformAt = (x: number, y: number) => `translate(${x}px, ${y}px) translate(-50%, -50%)`

// Custom pointer drag shared by the bookmark board and the category sidebar: a ghost follows the
// pointer, the target is resolved from hit testing, and the click that ends a drag is swallowed.
const usePointerDrag = <Target, Item>({
  resolveTarget,
  sameTarget = Object.is,
  onDrop,
}: {
  resolveTarget: (x: number, y: number, item: Item) => Target | null
  sameTarget?: (left: Target, right: Target) => boolean
  onDrop: (item: Item, target: Target) => void
}) => {
  const [drag, setDrag] = useState<DragState<Target, Item> | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  // Pointer position lives outside React state: a re-render per pointer move redraws every item.
  const positionRef = useRef({ x: 0, y: 0 })

  const moveGhost = (x: number, y: number) => {
    positionRef.current = { x, y }
    if (ghostRef.current) ghostRef.current.style.transform = transformAt(x, y)
  }

  const startDrag = (item: Item, event: ReactPointerEvent<HTMLElement>) => {
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
      const target = resolveTarget(moveEvent.clientX, moveEvent.clientY, item)
      setDrag((current) => {
        if (current && (current.target === target || (current.target !== null && target !== null && sameTarget(current.target, target)))) return current
        return { item, target }
      })
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
      const target = resolveTarget(upEvent.clientX, upEvent.clientY, item)
      if (target !== null) onDrop(item, target)
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

export { transformAt, usePointerDrag }
