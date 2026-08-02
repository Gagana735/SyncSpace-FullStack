require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const socketHandler = require("./socket/socketHandler");
const { socketAuthMiddleware } = require("./socket/socketAuth"); // <-- added
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes"); // <-- added
const roomRoutes = require("./routes/roomRoutes"); // <-- added

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// API route
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// Auth & room REST routes (added)
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Require a valid JWT before any socket connection is accepted (added)
io.use(socketAuthMiddleware);

// Call socket handler
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
