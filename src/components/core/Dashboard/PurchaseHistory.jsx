import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { getUserEnrolledCourses } from "../../../services/operations/profileAPI"

export default function PurchaseHistory() {
  const { token } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [courses, setCourses] = useState(null)

  useEffect(() => {
    ;(async () => {
      const res = await getUserEnrolledCourses(token)
      setCourses(res || [])
    })()
  }, [token])

  if (!courses) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-richblack-5">
        Loading...
      </div>
    )
  }

  return (
    <div className="text-richblack-5">
      <h1 className="mb-8 text-3xl font-medium">Purchase History</h1>
      {!courses.length ? (
        <p className="text-richblack-300">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-richblack-700">
          <table className="w-full text-left">
            <thead className="bg-richblack-700 text-sm uppercase text-richblack-50">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course._id}
                  className="border-t border-richblack-700 text-richblack-100"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnail}
                        alt={course.courseName}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <span className="font-medium text-richblack-5">
                        {course.courseName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">₹{course.price}</td>
                  <td className="px-4 py-3 text-caribbeangreen-200">Purchased</td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md bg-yellow-50 px-3 py-1 text-sm font-semibold text-richblack-900"
                      onClick={() => {
                        const section = course.courseContent?.[0]
                        const sub = section?.subSection?.[0]
                        if (section && sub) {
                          navigate(
                            `/view-course/${course._id}/section/${section._id}/sub-section/${sub._id}`
                          )
                        } else {
                          navigate("/dashboard/enrolled-courses")
                        }
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
