const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true,
        },
        docName: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

documentSchema.index({ roomId: 1, docName: 1 }, { unique: true });

module.exports = mongoose.model("Document", documentSchema);