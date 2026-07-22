import { FiLogOut, FiCopy } from 'react-icons/fi'
import { useSocket } from '../../context/SocketContext'
import { useRoom } from '../../context/RoomContext'
import './Header.css'

export default function Header({ onLeave }) {
  const { roomId, user } = useRoom()
  const { connected, activeUsers } = useSocket()

  function copyRoomCode() {
    navigator.clipboard?.writeText(roomId)
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-logo">SyncSpace</span>
        <button className="room-code-pill" onClick={copyRoomCode} title="Copy room code">
          {roomId} <FiCopy size={12} />
        </button>
        <span className={`connection-dot ${connected ? 'online' : 'offline'}`} />
        <span className="connection-label">{connected ? 'Live' : 'Connecting…'}</span>
      </div>

      <div className="app-header-right">
        <div className="active-users">
          {activeUsers.map((u) => (
            <span key={u.id} className="user-avatar" style={{ background: u.color }} title={u.name}>
              {u.name?.[0]?.toUpperCase()}
            </span>
          ))}
          <span className="user-avatar self" style={{ background: user.color }} title={`${user.name} (you)`}>
            {user.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <button className="leave-btn" onClick={onLeave}>
          <FiLogOut size={14} /> Leave
        </button>
      </div>
    </header>
  )
}
