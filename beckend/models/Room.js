const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        createdBy: {
            id: String,
            name: String,
            color: String,
        },
        // --- Added for JWT auth / access control ---
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        invitedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
