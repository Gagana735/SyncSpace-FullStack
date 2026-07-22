import { useState } from 'react'
import { SocketProvider } from './context/SocketContext'
import { RoomProvider } from './context/RoomContext'
import RoomJoin from './components/Login/RoomJoin'
import Header from './components/Header/Header'
import SplitScreen from './components/Layout/SplitScreen'
import Whiteboard from './components/Whiteboard/Whiteboard'
import CodeEditor from './components/CodeEditor/CodeEditor'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null) // { roomId, user }

  if (!session) {
    return <RoomJoin onJoin={setSession} />
  }

  return (
    <RoomProvider roomId={session.roomId} user={session.user}>
      <SocketProvider roomId={session.roomId} user={session.user}>
        <div className="app-shell">
          <Header onLeave={() => setSession(null)} />
          <SplitScreen left={<Whiteboard />} right={<CodeEditor />} />
        </div>
      </SocketProvider>
    </RoomProvider>
  )
}
