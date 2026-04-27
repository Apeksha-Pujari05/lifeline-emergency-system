const express = require("express");
const router  = express.Router();
const auth    = require("../controllers/authController");

router.post("/login",  auth.login);
router.post("/signup", auth.signup);
router.get("/users",   auth.getUsers);   // admin only
router.put("/users/:id/role", auth.updateRole);

module.exports = router;