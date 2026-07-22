

function toBase64(uint8arr) {
    return Buffer.from(uint8arr).toString("base64");
}

function fromBase64(base64) {
    return new Uint8Array(Buffer.from(base64, "base64"));
}

module.exports = { toBase64, fromBase64 };x