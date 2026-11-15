const Course = require("../models/Course")
const { buildCourseContext } = require("../utils/buildCourseContext")
const { askGemini } = require("../utils/geminiClient")

/**
 * AI Course Tutor
 * 1) Loads the selected course from MongoDB
 * 2) Builds a text context (curriculum, description, etc.)
 * 3) Sends context + student question to Gemini
 */
exports.askCourseTutor = async (req, res) => {
  try {
    const { courseId, message, history } = req.body

    if (!courseId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "courseId and message are required",
      })
    }

    const courseData = await buildCourseContext(courseId)

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    const systemPrompt = `You are StudyNotion AI Tutor, a helpful teaching assistant for an online learning platform.

Use ONLY the course context below to answer the student's question.
If the answer is not in the context, say you do not have that detail in this course yet, and suggest what part of the curriculum might help.
Keep answers clear, structured, and beginner-friendly.
Do not invent lectures or topics that are not listed.

COURSE CONTEXT:
${courseData.context}`

    const reply = await askGemini({
      systemPrompt,
      userMessage: message.trim(),
      history: Array.isArray(history) ? history : [],
    })

    return res.status(200).json({
      success: true,
      data: {
        reply,
        courseName: courseData.courseName,
      },
    })
  } catch (error) {
    console.error("AI Tutor Error:", error)
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "AI tutor failed to respond",
    })
  }
}

/**
 * Returns published courses for the chatbot course picker
 */
exports.getTutorCourses = async (req, res) => {
  try {
    const courses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        thumbnail: true,
      }
    )
      .sort({ courseName: 1 })
      .lean()

    return res.status(200).json({
      success: true,
      data: courses,
    })
  } catch (error) {
    console.error("getTutorCourses Error:", error)
    return res.status(500).json({
      success: false,
      message: "Could not fetch courses for AI tutor",
    })
  }
}
