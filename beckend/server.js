require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const socketHandler = require("./socket/socketHandler");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API route
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Call socket handler
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});