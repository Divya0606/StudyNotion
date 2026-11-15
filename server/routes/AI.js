const express = require("express")
const router = express.Router()

const { askCourseTutor, getTutorCourses } = require("../controllers/AI")
const { auth } = require("../middlewares/auth")

// List published courses for the tutor dropdown
router.get("/courses", getTutorCourses)

// Ask the AI course tutor (login required)
router.post("/tutor", auth, askCourseTutor)

module.exports = router
