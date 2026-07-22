import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useYjsDoc, usePresence } from '../../hooks/useYjsDoc'
import { useRoom } from '../../context/RoomContext'
import { CODE_LANGUAGES } from '../../utils/constants'
import './CodeEditor.css'

// Binds a Monaco editor instance to a shared Y.Text so keystrokes from every
// participant merge conflict-free (CRDT), instead of last-write-wins.
export default function CodeEditor() {
  const { user } = useRoom()
  const { doc, ready } = useYjsDoc('code')
  const { peers } = usePresence('code-cursor', user)

  const [language, setLanguage] = useState('javascript')
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const bindingRef = useRef(null)
  const isApplyingRemote = useRef(false)

  const yText = doc.getText('monaco')

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor
    monacoRef.current = monaco

    // Initialize editor content from whatever is already in the shared doc
    editor.setValue(yText.toString())

    // Local edits -> Y.Text
    const onLocalChange = editor.onDidChangeModelContent((event) => {
      if (isApplyingRemote.current) return
      doc.transact(() => {
        for (const change of event.changes) {
          const { rangeOffset, rangeLength, text } = change
          if (rangeLength > 0) yText.delete(rangeOffset, rangeLength)
          if (text.length > 0) yText.insert(rangeOffset, text)
        }
      })
    })

    // Remote Y.Text changes -> editor
    function onYTextChange(event, transaction) {
      if (transaction.local) return
      isApplyingRemote.current = true
      const model = editor.getModel()
      const cursor = editor.getPosition()
      model.setValue(yText.toString())
      if (cursor) editor.setPosition(cursor)
      isApplyingRemote.current = false
    }
    yText.observe(onYTextChange)

    bindingRef.current = () => {
      onLocalChange.dispose()
      yText.unobserve(onYTextChange)
    }
  }

  useEffect(() => {
    return () => {
      if (bindingRef.current) bindingRef.current()
    }
  }, [])

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {CODE_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <div className="code-editor-peers">
          {Object.entries(peers).map(([id, peer]) => (
            <span key={id} className="code-peer-chip" style={{ borderColor: peer?.data?.color }}>
              {peer?.data?.name || 'Guest'}
            </span>
          ))}
        </div>
      </div>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
      {!ready && <div className="code-editor-loading">Connecting…</div>}
    </div>
  )
}
