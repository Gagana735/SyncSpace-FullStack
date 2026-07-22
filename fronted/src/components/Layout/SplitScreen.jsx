import { useRef, useState, useCallback } from 'react'
import './SplitScreen.css'

// A simple draggable split layout: whiteboard on the left, code editor on the right.
// Percentage-based so it stays responsive on resize.
export default function SplitScreen({ left, right }) {
  const containerRef = useRef(null)
  const [leftWidth, setLeftWidth] = useState(50) // percentage
  const dragging = useRef(false)

  const onMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    document.body.style.cursor = ''
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    let pct = ((e.clientX - rect.left) / rect.width) * 100
    pct = Math.min(80, Math.max(20, pct))
    setLeftWidth(pct)
  }, [])

  return (
    <div
      className="split-screen"
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="split-pane" style={{ width: `${leftWidth}%` }}>
        {left}
      </div>
      <div className="split-divider" onMouseDown={onMouseDown} />
      <div className="split-pane" style={{ width: `${100 - leftWidth}%` }}>
        {right}
      </div>
    </div>
  )
}
