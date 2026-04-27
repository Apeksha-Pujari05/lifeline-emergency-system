const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  user_id:     { type: String, default: "" },
  type:        { type: String, required: true, enum: ["Medical", "Police", "Fire"] },
  description: { type: String, required: true },
  latitude:    { type: Number, default: null },
  longitude:   { type: Number, default: null },
  status:      { type: String, default: "Pending", enum: ["Pending", "Active", "Resolved"] }
}, { timestamps: true });

module.exports = mongoose.model("Incident", IncidentSchema);