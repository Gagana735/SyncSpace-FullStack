import './RemoteCursors.css'

// Renders other users' live cursor positions as small labeled dots,
// overlaid on top of the whiteboard canvas.
export default function RemoteCursors({ peers, currentUserId }) {
  return (
    <div className="remote-cursors">
      {Object.entries(peers).map(([userId, peer]) => {
        if (userId === currentUserId || !peer?.data) return null
        const { x, y, name, color } = peer.data
        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{ left: x, top: y, '--cursor-color': color }}
          >
            <span className="remote-cursor-dot" />
            <span className="remote-cursor-label">{name}</span>
          </div>
        )
      })}
    </div>
  )
}
