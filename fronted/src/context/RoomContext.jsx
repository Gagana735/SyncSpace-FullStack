import { createContext, useContext } from 'react'

const RoomContext = createContext(null)

export function RoomProvider({ roomId, user, children }) {
  return (
    <RoomContext.Provider value={{ roomId, user }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider')
  return ctx
}
