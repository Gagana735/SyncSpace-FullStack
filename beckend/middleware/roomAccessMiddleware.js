const Room = require("../models/Room");

const checkRoomAccess = async (req, res, next) => {
  const room = await Room.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(404).json({ message: "Room not found" });

  const isInvited = room.invitedUsers.some(
    (id) => String(id) === String(req.user._id)
  );

  if (!isInvited) {
    return res.status(403).json({ message: "You are not invited to this room" });
  }

  req.room = room;
  next();
};

module.exports = { checkRoomAccess };
