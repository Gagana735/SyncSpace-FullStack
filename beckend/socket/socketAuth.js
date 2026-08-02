const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Room = require("../models/Room");

// Runs once per socket connection (the handshake). Rejects the connection
// entirely if there's no valid token.
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("Authentication error: User not found"));

    socket.authUser = user; // real, verified identity
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
};

// Checks whether the authenticated socket user is allowed into a room.
// If the room doesn't exist yet, the joining user becomes its owner
// (mirrors the existing upsert-on-first-join behavior in socketHandler.js).
const checkSocketRoomAccess = async (socket, roomId) => {
  let room = await Room.findOne({ roomId });

  if (!room) {
    room = await Room.create({
      roomId,
      createdBy: { id: String(socket.authUser._id), name: socket.authUser.name, color: "#000000" },
      owner: socket.authUser._id,
      invitedUsers: [socket.authUser._id],
    });
    return room;
  }

  const isInvited = room.invitedUsers.some(
    (id) => String(id) === String(socket.authUser._id)
  );
  if (!isInvited) throw new Error("Not invited to this room");

  return room;
};

module.exports = { socketAuthMiddleware, checkSocketRoomAccess };
