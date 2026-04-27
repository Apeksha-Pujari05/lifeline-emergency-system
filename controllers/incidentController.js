const Incident = require("../models/Incident");

// POST /api/incidents/sos
exports.sendSOS = async (req, res) => {
  try {
    const { type, description, latitude, longitude } = req.body;
    const userEmail = req.headers["x-user-email"] || "";
    const userId    = req.headers["x-user-id"]    || "";

    if (!type || !description) {
      return res.status(400).json({ message: "Type and description are required" });
    }

    const incident = new Incident({
      user_id:     userId || userEmail,
      type,
      description,
      latitude:    latitude  || null,
      longitude:   longitude || null,
      status:      "Pending"
    });

    await incident.save();

    return res.json({ success: true, message: "Emergency SOS sent successfully", id: incident._id });

  } catch (err) {
    console.error("sendSOS error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/incidents/all  (admin & responder)
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({}).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("getAllIncidents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/incidents/mine  (user's own incidents)
exports.getMyIncidents = async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"] || "";
    const userId    = req.headers["x-user-id"]    || "";

    // Match by user_id (could be email or mongo id)
    const query = userId
      ? { $or: [{ user_id: userId }, { user_id: userEmail }] }
      : { user_id: userEmail };

    const incidents = await Incident.find(query).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("getMyIncidents error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/incidents/:id/status  (admin & responder)
exports.updateStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ["Pending", "Active", "Resolved"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json({ success: true, message: `Status updated to ${status}`, incident });

  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};