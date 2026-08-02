const Room = require("../models/Room");
const User = require("../models/User");

// @route POST /api/rooms/create
// body: { roomId, name (optional) }
exports.createRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: "roomId is required" });

    const existing = await Room.findOne({ roomId });
    if (existing) {
      return res.status(400).json({ message: "Room with this roomId already exists" });
    }

    const room = await Room.create({
      roomId,
      createdBy: { id: String(req.user._id), name: req.user.name, color: "#000000" },
      owner: req.user._id,
      invitedUsers: [req.user._id],
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/rooms/:roomId/invite
// body: { email }
exports.inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (String(room.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the owner can invite users" });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ message: "User not found" });

    if (!room.invitedUsers.some((id) => String(id) === String(userToInvite._id))) {
      room.invitedUsers.push(userToInvite._id);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/rooms/:roomId  (protected by checkRoomAccess)
exports.getRoom = async (req, res) => {
  res.json(req.room);
};

// @route GET /api/rooms/mine
exports.getMyRooms = async (req, res) => {
  const rooms = await Room.find({ invitedUsers: req.user._id });
  res.json(rooms);
};
