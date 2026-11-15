import { toast } from "react-hot-toast"
import { apiConnector } from "../apiconnector"
import { aiEndpoints } from "../apis"

const { AI_TUTOR_API, AI_TUTOR_COURSES_API } = aiEndpoints

export async function fetchTutorCourses() {
  try {
    const response = await apiConnector("GET", AI_TUTOR_COURSES_API)
    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch courses")
    }
    return response.data.data || []
  } catch (error) {
    console.log("AI_TUTOR_COURSES_API ERROR............", error)
    return []
  }
}

export async function askCourseTutor({ courseId, message, history, token }) {
  try {
    const response = await apiConnector(
      "POST",
      AI_TUTOR_API,
      { courseId, message, history },
      {
        Authorization: `Bearer ${token}`,
        Authorisation: `Bearer ${token}`,
      }
    )

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "AI tutor failed")
    }

    return response.data.data
  } catch (error) {
    console.log("AI_TUTOR_API ERROR............", error)
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Could not get AI response"
    toast.error(message)
    return null
  }
}
