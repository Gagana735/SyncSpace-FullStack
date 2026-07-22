export const TOOLS = {
  PEN: 'pen',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  ERASER: 'eraser',
  SELECT: 'select',
}

export const STROKE_COLORS = [
  '#1A1A1A', '#E03131', '#2F9E44', '#1971C2',
  '#F08C00', '#9C36B5', '#FFFFFF',
]

export const STROKE_WIDTHS = [2, 4, 6, 10]

export const CODE_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
]

// Assigns a stable-ish color per user so cursors/avatars are distinguishable
export const USER_COLORS = [
  '#E03131', '#2F9E44', '#1971C2', '#F08C00',
  '#9C36B5', '#0CA678', '#E64980', '#4263EB',
]

export function colorForUser(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}
