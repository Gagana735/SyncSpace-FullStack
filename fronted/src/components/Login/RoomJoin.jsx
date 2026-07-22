import { useState } from 'react'
import { colorForUser } from '../../utils/constants'
import './RoomJoin.css'

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Simple entry screen: collect a display name + room code, then hand off
// to the main app. Real auth (JWT) plugs in here later — see the
// `token` field left as a placeholder for Member 4's work.
export default function RoomJoin({ onJoin }) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [mode, setMode] = useState('create') // 'create' | 'join'

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    const finalRoomId = mode === 'create' ? randomRoomCode() : roomId.trim().toUpperCase()
    if (!finalRoomId) return

    const userId = randomId()
    const user = {
      id: userId,
      name: name.trim(),
      color: colorForUser(userId),
    }
    onJoin({ roomId: finalRoomId, user })
  }

  return (
    <div className="room-join">
      <div className="room-join-card">
        <h1>SyncSpace</h1>
        <p className="room-join-subtitle">Real-time collaborative whiteboard &amp; code editor</p>

        <div className="room-join-tabs">
          <button
            type="button"
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create session
          </button>
          <button
            type="button"
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join session
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Musab"
              required
            />
          </label>

          {mode === 'join' && (
            <label>
              Room code
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. A1B2C3"
                required
              />
            </label>
          )}

          <button type="submit" className="room-join-submit">
            {mode === 'create' ? 'Create & Enter Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  )
}
