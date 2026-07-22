import * as Y from 'yjs'
import { fromUint8Array, toUint8Array } from './base64'

export class SocketIOYjsProvider {
  constructor({ socket, roomId, docName, ydoc }) {
    this.socket = socket
    this.roomId = roomId
    this.docName = docName
    this.doc = ydoc
    this.synced = false

    this._onDocUpdate = this._onDocUpdate.bind(this)
    this._onRemoteUpdate = this._onRemoteUpdate.bind(this)
    this._onSyncResponse = this._onSyncResponse.bind(this)

    this.doc.on('update', this._onDocUpdate)
    this.socket.on('doc:update', this._onRemoteUpdate)
    this.socket.on('doc:sync-response', this._onSyncResponse)

    // Ask the server for the current document state as soon as we connect
    if (this.socket.connected) {
      this._requestSync()
    }
    this.socket.on('connect', () => this._requestSync())
  }

  _requestSync() {
    this.socket.emit('doc:sync-request', { roomId: this.roomId, docName: this.docName })
  }

  _onSyncResponse({ docName, update }) {
    if (docName !== this.docName || !update) return
    Y.applyUpdate(this.doc, toUint8Array(update), 'remote')
    this.synced = true
  }

  _onRemoteUpdate({ docName, update }) {
    if (docName !== this.docName) return
    Y.applyUpdate(this.doc, toUint8Array(update), 'remote')
  }

  _onDocUpdate(update, origin) {
    // Don't re-broadcast changes that came from the network
    if (origin === 'remote') return
    this.socket.emit('doc:update', {
      roomId: this.roomId,
      docName: this.docName,
      update: fromUint8Array(update),
    })
  }

  destroy() {
    this.doc.off('update', this._onDocUpdate)
    this.socket.off('doc:update', this._onRemoteUpdate)
    this.socket.off('doc:sync-response', this._onSyncResponse)
  }
}
