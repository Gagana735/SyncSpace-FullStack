import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { SocketIOYjsProvider } from './SocketIOYjsProvider'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'


export function useYjsDoc(docName) {
  const { socket, connected } = useSocket()
  const { roomId } = useRoom()
  const docRef = useRef(null)
  const providerRef = useRef(null)
  const [ready, setReady] = useState(false)

  if (!docRef.current) {
    docRef.current = new Y.Doc()
  }

  useEffect(() => {
    if (!socket) return
    const doc = docRef.current
    const provider = new SocketIOYjsProvider({ socket, roomId, docName, ydoc: doc })
    providerRef.current = provider
    setReady(true)

    return () => {
      provider.destroy()
    }
   
  }, [socket, docName])

  return { doc: docRef.current, ready, connected }
}


export function usePresence(channel, user) {
  const { socket } = useSocket()
  const [peers, setPeers] = useState({}) // userId -> { user, data }

  useEffect(() => {
    if (!socket) return

    function onPresence({ channel: ch, userId, data }) {
      if (ch !== channel) return
      setPeers((prev) => ({ ...prev, [userId]: { ...prev[userId], data } }))
    }
    function onUserLeft({ id }) {
      setPeers((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }

    socket.on('presence:update', onPresence)
    socket.on('user:left', onUserLeft)
    return () => {
      socket.off('presence:update', onPresence)
      socket.off('user:left', onUserLeft)
    }
  }, [socket, channel])

  function broadcast(data) {
    if (!socket) return
    socket.emit('presence:update', { channel, user, data })
  }

  return { peers, broadcast }
}
