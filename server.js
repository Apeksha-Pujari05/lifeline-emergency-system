const express    = require("express");
const path       = require("path");
const bodyParser = require("body-parser");
const cors       = require("cors");
const db         = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
const authRoutes     = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const contactRoutes  = require("./routes/contacts");

app.use("/api/auth",      authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/contacts",  contactRoutes);

// HTML page routes
app.get("/",            (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login",       (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/signup",      (req, res) => res.sendFile(path.join(__dirname, "public", "signup.html")));
app.get("/dashboard",   (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/admin",       (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/responder",   (req, res) => res.sendFile(path.join(__dirname, "public", "responder.html")));
app.get("/sos",         (req, res) => res.sendFile(path.join(__dirname, "public", "sos.html")));

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  res.redirect("/login.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚨 LIFELINE running on http://localhost:${PORT}`);
  console.log(`   Admin    → http://localhost:${PORT}/admin.html`);
  console.log(`   Responder→ http://localhost:${PORT}/responder.html`);
  console.log(`   User     → http://localhost:${PORT}/dashboard.html\n`);
});