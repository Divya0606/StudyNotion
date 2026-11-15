import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import { BsFillCaretRightFill } from "react-icons/bs"
import { FaShareSquare } from "react-icons/fa"

import Footer from "../components/common/Footer"
import RatingStars from "../components/common/RatingStars"
import { fetchCourseDetails } from "../services/operations/courseDetailsAPI"
import GetAvgRating from "../utils/avgRating"
import { ACCOUNT_TYPE } from "../utils/constants"
import { addToCart } from "../slices/cartSlice"

function CourseDetails() {
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)
  const { cart } = useSelector((state) => state.cart)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { courseId } = useParams()

  const [course, setCourse] = useState(null)
  const [totalDuration, setTotalDuration] = useState("")
  const [avgReviewCount, setAvgReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const res = await fetchCourseDetails(courseId)
      if (res?.success) {
        setCourse(res.data.courseDetails)
        setTotalDuration(res.data.totalDuration)
        setAvgReviewCount(GetAvgRating(res.data.courseDetails.ratingAndReviews))
      } else {
        toast.error(res?.message || "Could not load course")
      }
      setLoading(false)
    })()
  }, [courseId])

  const handleBuyOrCart = () => {
    if (!token) {
      navigate("/login")
      return
    }
    if (user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      toast.error("Instructors cannot buy a course")
      return
    }
    if (user?.courses?.includes(course._id)) {
      navigate("/dashboard/enrolled-courses")
      return
    }
    if (cart.find((item) => item._id === course._id)) {
      navigate("/dashboard/cart")
      return
    }
    dispatch(addToCart(course))
    navigate("/dashboard/cart")
  }

  const alreadyEnrolled =
    user?.courses?.some((id) => id === course?._id || id?._id === course?._id) ||
    course?.studentsEnrolled?.some(
      (id) => id === user?._id || id?._id === user?._id
    )

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-white">
        Loading course...
      </div>
    )
  }

  if (!course) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-white">
        Course not found
      </div>
    )
  }

  return (
    <>
      <div className="relative w-full bg-richblack-800">
        <div className="mx-auto box-content px-4 lg:w-[1260px] 2xl:relative">
          <div className="mx-auto grid min-h-[280px] max-w-maxContentTab justify-items-center py-8 lg:mx-0 lg:justify-items-start lg:py-12">
            <div className="relative block max-h-[30rem] lg:hidden">
              <img
                src={course.thumbnail}
                alt="course thumbnail"
                className="aspect-auto w-full max-h-[30rem] rounded-md object-cover"
              />
            </div>

            <div className="z-30 my-5 flex flex-col justify-center gap-4 py-5 text-lg text-richblack-5">
              <p className="text-4xl font-bold text-richblack-5 sm:text-[42px]">
                {course.courseName}
              </p>
              <p className="text-richblack-200">{course.courseDescription}</p>
              <div className="flex flex-wrap items-center gap-2 text-md">
                <span className="text-yellow-25">{avgReviewCount || 0}</span>
                <RatingStars Review_Count={avgReviewCount} Star_Size={24} />
                <span>{`(${course.ratingAndReviews?.length || 0} reviews)`}</span>
                <span>{`${course.studentsEnrolled?.length || 0} students enrolled`}</span>
              </div>
              <p>
                Created by {course.instructor?.firstName}{" "}
                {course.instructor?.lastName}
              </p>
              <p>Duration: {totalDuration || "N/A"}</p>
            </div>
          </div>

          <div className="right-[1rem] top-[60px] mx-auto hidden min-h-[400px] w-1/3 max-w-[410px] translate-y-24 md:translate-y-0 lg:absolute lg:block">
            <div className="flex flex-col gap-4 rounded-md bg-richblack-700 p-4 text-richblack-5">
              <img
                src={course.thumbnail}
                alt={course.courseName}
                className="max-h-[300px] min-h-[180px] w-full overflow-hidden rounded-2xl object-cover"
              />
              <p className="space-x-3 pb-2 text-3xl font-semibold">
                Rs. {course.price}
              </p>
              <button
                className="yellowButton bg-yellow-50 text-richblack-900 rounded-md py-2 font-semibold"
                onClick={() => {
                  if (alreadyEnrolled) {
                    navigate("/dashboard/enrolled-courses")
                  } else {
                    handleBuyOrCart()
                  }
                }}
              >
                {alreadyEnrolled ? "Go To Course" : "Add to Cart"}
              </button>
              <button
                className="flex items-center gap-2 text-sm text-yellow-100"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success("Link copied")
                }}
              >
                <FaShareSquare size={15} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto box-content px-4 text-start text-richblack-5 lg:w-[1260px]">
        <div className="mx-auto max-w-maxContentTab lg:mx-0 xl:max-w-[810px]">
          <div className="my-8 border border-richblack-600 p-6">
            <p className="text-2xl font-semibold">What you'll learn</p>
            <div className="mt-3 whitespace-pre-wrap">{course.whatYouWillLearn}</div>
          </div>

          <div className="max-w-[830px]">
            <p className="text-[28px] font-semibold">Course Content</p>
            <div className="mt-4">
              {course.courseContent?.map((section) => (
                <details
                  key={section._id}
                  className="mb-2 overflow-hidden rounded-md border border-richblack-600"
                  open
                >
                  <summary className="flex cursor-pointer items-center justify-between bg-richblack-700 px-4 py-3">
                    <p className="font-semibold">
                      {section.sectionName || "Section"}
                    </p>
                    <p className="text-sm text-yellow-25">
                      {section.subSection?.length || 0} lectures
                    </p>
                  </summary>
                  <div className="px-4 py-2">
                    {section.subSection?.map((lecture) => (
                      <div
                        key={lecture._id}
                        className="flex items-center gap-2 border-b border-richblack-600 py-2 last:border-none"
                      >
                        <BsFillCaretRightFill />
                        <span>{lecture.title}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto my-8 flex w-11/12 flex-col gap-3 lg:hidden">
        <p className="text-2xl font-semibold text-richblack-5">
          Rs. {course.price}
        </p>
        <button
          className="rounded-md bg-yellow-50 py-2 font-semibold text-richblack-900"
          onClick={() => {
            if (alreadyEnrolled) navigate("/dashboard/enrolled-courses")
            else handleBuyOrCart()
          }}
        >
          {alreadyEnrolled ? "Go To Course" : "Add to Cart"}
        </button>
      </div>

      <Footer />
    </>
  )
}

export default CourseDetails
