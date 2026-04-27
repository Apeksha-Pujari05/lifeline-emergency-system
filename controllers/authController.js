const User = require("../models/User");

// Hardcoded roles (no DB needed for these)
const ADMIN_EMAIL     = "admin@lifeline.com";
const ADMIN_PASSWORD  = "admin123";
const RESP_EMAIL      = "responder@lifeline.com";
const RESP_PASSWORD   = "responder123";

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Admin check
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.json({ role: "admin", name: "Admin", email });
    }

    // Responder check
    if (email === RESP_EMAIL && password === RESP_PASSWORD) {
      return res.json({ role: "responder", name: "Responder", email });
    }

    // DB user
    const user = await User.findOne({ email, password });
    if (user) {
      return res.json({ 
        role: user.role, 
        name: user.name, 
        email: user.email, 
        id: user._id,
        profilePicture: user.profilePicture,
        aadhaarNumber: user.aadhaarNumber
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, phone, email, password, aadhaarNumber, profilePicture } = req.body;

    if (!name || !email || !password || !aadhaarNumber) {
      return res.status(400).json({ message: "Name, email, password, and Aadhaar Number are required" });
    }

    // Aadhaar Validation
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ message: "Invalid Aadhaar Number. Must be 12 digits." });
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Check duplicate Aadhaar
    const existingAadhaar = await User.findOne({ aadhaarNumber });
    if (existingAadhaar) {
      return res.status(409).json({ message: "This Aadhaar is already registered" });
    }

    const user = new User({ 
      name, 
      phone, 
      email, 
      password, 
      aadhaarNumber, 
      profilePicture: profilePicture || "",
      role: "user" 
    });
    await user.save();

    return res.json({ success: true, message: "Account created successfully" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/auth/users  (admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/auth/users/:id/role
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "responder", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};