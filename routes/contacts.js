const express = require("express");
const router  = express.Router();
const Contact = require("../models/Contact");

// Get all contacts for a user
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const contacts = await Contact.find({ userId });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a contact
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { name, relation, phone } = req.body;
    if (!userId || !name || !phone) return res.status(400).json({ message: "Missing fields" });
    
    const contact = new Contact({ userId, name, relation, phone });
    await contact.save();
    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a contact
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    await Contact.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
