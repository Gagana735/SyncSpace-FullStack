import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config'

const SocketContext = createContext(null)

/**
 * Wraps the app (once inside a room) with a single Socket.io connection.
 * Backend contract (Member 5 - Socket.io & Real-Time Features):
 *   Client -> Server:
 *     'room:join'   { roomId, user: { id, name, color } }
 *     'room:leave'  { roomId }
 *   Server -> Client:
 *     'room:users'  [{ id, name, color }]   // current members of the room
 *     'user:joined' { id, name, color }
 *     'user:left'   { id }
 * Yjs sync + cursor awareness events are defined separately in useYjsDoc.js
 */
export function SocketProvider({ roomId, user, children }) {
  const [connected, setConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const socketRef = useRef(null)

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }

  useEffect(() => {
    if (!roomId || !user) return
    const socket = socketRef.current

    function onConnect() {
      setConnected(true)
      socket.emit('room:join', { roomId, user })
    }
    function onDisconnect() {
      setConnected(false)
    }
    function onRoomUsers(users) {
      setActiveUsers(users)
    }
    function onUserJoined(joinedUser) {
      setActiveUsers((prev) => {
        if (prev.some((u) => u.id === joinedUser.id)) return prev
        return [...prev, joinedUser]
      })
    }
    function onUserLeft({ id }) {
      setActiveUsers((prev) => prev.filter((u) => u.id !== id))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room:users', onRoomUsers)
    socket.on('user:joined', onUserJoined)
    socket.on('user:left', onUserLeft)

    socket.connect()

    return () => {
      socket.emit('room:leave', { roomId })
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:users', onRoomUsers)
      socket.off('user:joined', onUserJoined)
      socket.off('user:left', onUserLeft)
      socket.disconnect()
    }
  }, [roomId, user])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, activeUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider')
  return ctx
}
