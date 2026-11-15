const express = require("express")
const router = express.Router()

const {
  capturePayment,
  verifyPayment,
  verifySignature,
} = require("../controllers/Payments")
const { auth, isStudent } = require("../middlewares/auth")

router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifyPayment", auth, isStudent, verifyPayment)
router.post("/verifySignature", auth, isStudent, verifySignature)

module.exports = router
