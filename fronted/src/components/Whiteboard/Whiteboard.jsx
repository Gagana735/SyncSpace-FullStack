import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Text as KonvaText } from 'react-konva'
import { useYjsDoc, usePresence } from '../../hooks/useYjsDoc'
import { useRoom } from '../../context/RoomContext'
import { TOOLS, STROKE_COLORS, STROKE_WIDTHS } from '../../utils/constants'
import Toolbar from './Toolbar'
import RemoteCursors from '../Presence/RemoteCursors'
import './Whiteboard.css'

let shapeIdCounter = 0
function newShapeId(userId) {
  shapeIdCounter += 1
  return `${userId}-${Date.now()}-${shapeIdCounter}`
}

export default function Whiteboard() {
  const { user } = useRoom()
  const { doc, ready } = useYjsDoc('whiteboard')
  const { peers, broadcast } = usePresence('whiteboard-cursor', user)

  const [tool, setTool] = useState(TOOLS.PEN)
  const [color, setColor] = useState(STROKE_COLORS[0])
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1])
  const [shapes, setShapes] = useState([])

  const isDrawing = useRef(false)
  const currentShapeId = useRef(null)
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  const yShapes = doc.getArray('shapes')

  // Keep local React state mirrored to the Yjs array so Konva re-renders on any change,
  // whether it originated locally or from a remote peer.
  useEffect(() => {
    function syncFromY() {
      setShapes(yShapes.toArray())
    }
    syncFromY()
    yShapes.observe(syncFromY)
    return () => yShapes.observe(syncFromY)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Responsive canvas sizing
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return
      const { clientWidth, clientHeight } = containerRef.current
      setSize({ width: clientWidth, height: clientHeight })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const pushShape = useCallback((shape) => {
    doc.transact(() => {
      yShapes.push([shape])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  const updateLastShape = useCallback((mutator) => {
    doc.transact(() => {
      const idx = yShapes.length - 1
      if (idx < 0) return
      const existing = yShapes.get(idx)
      const updated = mutator(existing)
      yShapes.delete(idx, 1)
      yShapes.insert(idx, [updated])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  function getPointer(stage) {
    const pos = stage.getPointerPosition()
    return pos || { x: 0, y: 0 }
  }

  function handleMouseDown(e) {
    const stage = e.target.getStage()
    const pos = getPointer(stage)

    if (tool === TOOLS.ERASER) {
      // click-to-erase: remove topmost shape under pointer, handled via shape's own onClick
      return
    }

    isDrawing.current = true
    const id = newShapeId(user.id)
    currentShapeId.current = id

    if (tool === TOOLS.PEN) {
      pushShape({ id, type: 'pen', points: [pos.x, pos.y], color, strokeWidth, author: user.id })
    } else if (tool === TOOLS.LINE) {
      pushShape({ id, type: 'line', points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth, author: user.id })
    } else if (tool === TOOLS.RECTANGLE) {
      pushShape({ id, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, color, strokeWidth, author: user.id })
    } else if (tool === TOOLS.ELLIPSE) {
      pushShape({ id, type: 'ellipse', x: pos.x, y: pos.y, radiusX: 0, radiusY: 0, color, strokeWidth, author: user.id })
    } else if (tool === TOOLS.TEXT) {
      const value = window.prompt('Text:')
      isDrawing.current = false
      if (value) {
        pushShape({ id, type: 'text', x: pos.x, y: pos.y, text: value, color, fontSize: 18, author: user.id })
      }
    }
  }

  function handleMouseMove(e) {
    const stage = e.target.getStage()
    const pos = getPointer(stage)
    broadcast({ x: pos.x, y: pos.y, name: user.name, color: user.color })

    if (!isDrawing.current) return

    if (tool === TOOLS.PEN) {
      updateLastShape((shape) => ({ ...shape, points: [...shape.points, pos.x, pos.y] }))
    } else if (tool === TOOLS.LINE) {
      updateLastShape((shape) => ({ ...shape, points: [shape.points[0], shape.points[1], pos.x, pos.y] }))
    } else if (tool === TOOLS.RECTANGLE) {
      updateLastShape((shape) => ({ ...shape, width: pos.x - shape.x, height: pos.y - shape.y }))
    } else if (tool === TOOLS.ELLIPSE) {
      updateLastShape((shape) => ({
        ...shape,
        radiusX: Math.abs(pos.x - shape.x),
        radiusY: Math.abs(pos.y - shape.y),
      }))
    }
  }

  function handleMouseUp() {
    isDrawing.current = false
    currentShapeId.current = null
  }

  function eraseShape(shapeId) {
    doc.transact(() => {
      const arr = yShapes.toArray()
      const idx = arr.findIndex((s) => s.id === shapeId)
      if (idx !== -1) yShapes.delete(idx, 1)
    })
  }

  function clearBoard() {
    if (!window.confirm('Clear the whole board for everyone?')) return
    doc.transact(() => {
      yShapes.delete(0, yShapes.length)
    })
  }

  return (
    <div className="whiteboard">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        onClear={clearBoard}
      />
      <div className="whiteboard-canvas" ref={containerRef}>
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {shapes.map((shape) => {
              const commonProps = {
                key: shape.id,
                onClick: () => tool === TOOLS.ERASER && eraseShape(shape.id),
                onTap: () => tool === TOOLS.ERASER && eraseShape(shape.id),
              }
              if (shape.type === 'pen') {
                return (
                  <Line
                    {...commonProps}
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.4}
                  />
                )
              }
              if (shape.type === 'line') {
                return (
                  <Line
                    {...commonProps}
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                  />
                )
              }
              if (shape.type === 'rectangle') {
                return (
                  <Rect
                    {...commonProps}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                  />
                )
              }
              if (shape.type === 'ellipse') {
                return (
                  <Ellipse
                    {...commonProps}
                    x={shape.x}
                    y={shape.y}
                    radiusX={shape.radiusX}
                    radiusY={shape.radiusY}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                  />
                )
              }
              if (shape.type === 'text') {
                return (
                  <KonvaText
                    {...commonProps}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fill={shape.color}
                  />
                )
              }
              return null
            })}
          </Layer>
        </Stage>
        <RemoteCursors peers={peers} currentUserId={user.id} />
      </div>
    </div>
  )
}
