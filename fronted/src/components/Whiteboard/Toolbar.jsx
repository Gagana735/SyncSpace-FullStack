import {
  FiEdit2, FiMinus, FiSquare, FiCircle, FiType, FiTrash2,
} from 'react-icons/fi'
import { TfiEraser } from 'react-icons/tfi'
import { TOOLS, STROKE_COLORS, STROKE_WIDTHS } from '../../utils/constants'
import './Toolbar.css'

const TOOL_BUTTONS = [
  { tool: TOOLS.PEN, icon: FiEdit2, label: 'Pen' },
  { tool: TOOLS.LINE, icon: FiMinus, label: 'Line' },
  { tool: TOOLS.RECTANGLE, icon: FiSquare, label: 'Rectangle' },
  { tool: TOOLS.ELLIPSE, icon: FiCircle, label: 'Ellipse' },
  { tool: TOOLS.TEXT, icon: FiType, label: 'Text' },
  { tool: TOOLS.ERASER, icon: TfiEraser, label: 'Eraser' },
]

export default function Toolbar({ tool, setTool, color, setColor, strokeWidth, setStrokeWidth, onClear }) {
  return (
    <div className="wb-toolbar">
      <div className="wb-toolbar-group">
        {TOOL_BUTTONS.map(({ tool: t, icon: Icon, label }) => (
          <button
            key={t}
            title={label}
            className={`wb-tool-btn ${tool === t ? 'active' : ''}`}
            onClick={() => setTool(t)}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className="wb-toolbar-group">
        {STROKE_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            className={`wb-color-swatch ${color === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="wb-toolbar-group">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            title={`${w}px`}
            className={`wb-width-btn ${strokeWidth === w ? 'active' : ''}`}
            onClick={() => setStrokeWidth(w)}
          >
            <span style={{ height: w }} className="wb-width-dot" />
          </button>
        ))}
      </div>

      <div className="wb-toolbar-group">
        <button title="Clear board" className="wb-tool-btn wb-danger" onClick={onClear}>
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  )
}
