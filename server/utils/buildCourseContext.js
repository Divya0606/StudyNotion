const Course = require("../models/Course")

/**
 * Pulls course content from MongoDB and formats it as text
 * so the AI can answer using real StudyNotion course data (RAG-lite).
 */
exports.buildCourseContext = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .populate("category")
    .populate("instructor", "firstName lastName")
    .lean()

  if (!course) {
    return null
  }

  const sections =
    course.courseContent
      ?.map((section, index) => {
        const lectures =
          section.subSection
            ?.map(
              (sub, subIndex) =>
                `    Lecture ${subIndex + 1}: ${sub.title || "Untitled"}${
                  sub.description ? ` — ${sub.description}` : ""
                }`
            )
            .join("\n") || "    No lectures yet"

        return `  Section ${index + 1}: ${section.sectionName || "Untitled"}\n${lectures}`
      })
      .join("\n") || "  No sections yet"

  const instructorName = course.instructor
    ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim()
    : "Unknown"

  const context = `
Course Name: ${course.courseName || "N/A"}
Instructor: ${instructorName}
Category: ${course.category?.name || "N/A"}
Price: ₹${course.price ?? "N/A"}
Status: ${course.status || "N/A"}
Description: ${course.courseDescription || "N/A"}
What You Will Learn: ${course.whatYouWillLearn || "N/A"}
Tags: ${(course.tag || []).join(", ") || "N/A"}
Instructions: ${(course.instructions || []).join("; ") || "N/A"}

Course Curriculum:
${sections}
`.trim()

  return {
    courseName: course.courseName,
    context,
  }
}
