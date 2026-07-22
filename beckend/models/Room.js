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
    },
    { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);