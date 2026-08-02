const express = require("express");
const {
  createRoom,
  inviteUser,
  getRoom,
  getMyRooms,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const { checkRoomAccess } = require("../middleware/roomAccessMiddleware");

const router = express.Router();

router.post("/create", protect, createRoom);
router.get("/mine", protect, getMyRooms);
router.post("/:roomId/invite", protect, inviteUser);
router.get("/:roomId", protect, checkRoomAccess, getRoom);

module.exports = router;
