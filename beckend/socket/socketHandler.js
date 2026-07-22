const Y = require("yjs");
const Room = require("../models/Room");
const Document = require("../models/Document");
const { toBase64, fromBase64 } = require("../utils/base64");

// In-memory cache of live Y.Doc instances, keyed by "roomId:docName".
// Kept in memory for speed while sockets are connected; persisted to
// MongoDB so the whiteboard/code state survives reconnects & restarts.
const yDocs = {};
const saveTimers = {};

// Tracks which room + user each connected socket belongs to
// (socket.id -> { roomId, user })
const socketUsers = {};

function getRoomUsers(io, roomId, excludeSocketId) {
    return Object.entries(socketUsers)
        .filter(([sid, entry]) => entry.roomId === roomId && sid !== excludeSocketId)
        .map(([, entry]) => entry.user);
}

async function loadYDoc(roomId, docName) {
    const key = `${roomId}:${docName}`;
    if (yDocs[key]) return yDocs[key];

    const doc = new Y.Doc();

    try {
        const saved = await Document.findOne({ roomId, docName });
        if (saved && saved.state) {
            Y.applyUpdate(doc, fromBase64(saved.state));
        }
    } catch (err) {
        console.error(`Failed to load document (${key}) from MongoDB:`, err.message);
    }

    yDocs[key] = doc;
    return doc;
}

// Debounced save so we don't hit MongoDB on every single keystroke/stroke
function schedulePersist(roomId, docName) {
    const key = `${roomId}:${docName}`;
    if (saveTimers[key]) clearTimeout(saveTimers[key]);

    saveTimers[key] = setTimeout(async () => {
        const doc = yDocs[key];
        if (!doc) return;
        const state = toBase64(Y.encodeStateAsUpdate(doc));
        try {
            await Document.findOneAndUpdate(
                { roomId, docName },
                { roomId, docName, state },
                { upsert: true }
            );
        } catch (err) {
            console.error(`Failed to save document (${key}) to MongoDB:`, err.message);
        }
    }, 1000);
}

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // ---- Room join/leave (persists the room in MongoDB) ----

        socket.on("room:join", async ({ roomId, user }) => {
            if (!roomId || !user) return;

            socket.join(roomId);
            socketUsers[socket.id] = { roomId, user };

            try {
                await Room.findOneAndUpdate(
                    { roomId },
                    { $setOnInsert: { roomId, createdBy: user } },
                    { upsert: true }
                );
            } catch (err) {
                console.error("Failed to save room to MongoDB:", err.message);
            }

            // Send the current member list to the person who just joined
            socket.emit("room:users", getRoomUsers(io, roomId, socket.id));

            // Tell everyone else in the room that a new user joined
            socket.to(roomId).emit("user:joined", user);

            console.log(`${socket.id} joined room ${roomId}`);
        });

        socket.on("room:leave", ({ roomId }) => {
            const entry = socketUsers[socket.id];
            socket.leave(roomId);

            if (entry) {
                socket.to(entry.roomId).emit("user:left", { id: entry.user.id });
                delete socketUsers[socket.id];
            }

            console.log(`${socket.id} left room ${roomId}`);
        });

        // ---- Yjs document sync (whiteboard + code editor), persisted in MongoDB ----

        socket.on("doc:sync-request", async ({ roomId, docName }) => {
            if (!roomId || !docName) return;
            const doc = await loadYDoc(roomId, docName);
            const update = toBase64(Y.encodeStateAsUpdate(doc));
            socket.emit("doc:sync-response", { docName, update });
        });

        socket.on("doc:update", async ({ roomId, docName, update }) => {
            if (!roomId || !docName || !update) return;

            const doc = await loadYDoc(roomId, docName);
            Y.applyUpdate(doc, fromBase64(update), "remote");

            // Broadcast the incremental update to every other client in the room
            socket.to(roomId).emit("doc:update", { docName, update });

            // Save the merged state to MongoDB (debounced)
            schedulePersist(roomId, docName);
        });

        // ---- Live cursor / presence broadcast (not persisted, ephemeral) ----

        socket.on("presence:update", ({ channel, user, data }) => {
            const entry = socketUsers[socket.id];
            if (!entry) return;
            socket.to(entry.roomId).emit("presence:update", {
                channel,
                userId: user.id,
                data,
            });
        });

        // ---- Disconnect cleanup ----

        socket.on("disconnect", () => {
            const entry = socketUsers[socket.id];
            if (entry) {
                socket.to(entry.roomId).emit("user:left", { id: entry.user.id });
                delete socketUsers[socket.id];
            }
            console.log("User disconnected:", socket.id);
        });
    });
};