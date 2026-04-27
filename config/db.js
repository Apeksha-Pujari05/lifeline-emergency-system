const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lifelineDB";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected → lifelineDB"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("   Make sure MongoDB is running: mongod");
  });

module.exports = mongoose;