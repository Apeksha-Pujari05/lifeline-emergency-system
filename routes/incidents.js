const express = require("express");
const router  = express.Router();
const inc     = require("../controllers/incidentController");

router.post("/sos",           inc.sendSOS);         // user sends SOS
router.get("/all",            inc.getAllIncidents);  // admin / responder
router.get("/mine",           inc.getMyIncidents);  // user's own
router.put("/:id/status",     inc.updateStatus);    // admin / responder

module.exports = router;