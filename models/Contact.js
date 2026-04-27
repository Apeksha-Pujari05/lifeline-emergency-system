const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:     { type: String, required: true },
  relation: { type: String, default: "Friend" },
  phone:    { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Contact", ContactSchema);
