const { instance } = require("../config/razorpay")
const Course = require("../models/Course")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const mongoose = require("mongoose")
const crypto = require("crypto")

async function enrollStudents(courses, userId, res) {
  if (!courses || !courses.length || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide courses and userId",
    })
  }

  for (const courseId of courses) {
    try {
      const enrolledCourse = await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { studentsEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, message: "Course not found" })
      }

      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { courses: courseId } },
        { new: true }
      )

      try {
        await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        )
      } catch (mailError) {
        console.log("Enrollment mail skipped:", mailError.message)
      }
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  return true
}

// Create Razorpay order for one or more courses
exports.capturePayment = async (req, res) => {
  try {
    const { courses, course_id } = req.body
    const userId = req.user.id

    const courseList = Array.isArray(courses)
      ? courses
      : course_id
        ? [course_id]
        : []

    if (!courseList.length) {
      return res.json({
        success: false,
        message: "Please provide valid course ID(s)",
      })
    }

    let totalAmount = 0

    for (const id of courseList) {
      let course
      try {
        course = await Course.findById(id)
        if (!course) {
          return res.json({
            success: false,
            message: "Could not find the course",
          })
        }

        const uid = new mongoose.Types.ObjectId(userId)
        if (course.studentsEnrolled.some((enrolledId) => String(enrolledId) === String(uid))) {
          return res.status(200).json({
            success: false,
            message: "Student is already enrolled",
          })
        }

        totalAmount += course.price || 0
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: error.message,
        })
      }
    }

    // Free course, or local testing without Razorpay
    if (totalAmount === 0 || process.env.ALLOW_DIRECT_ENROLL === "true") {
      const enrolled = await enrollStudents(courseList, userId, res)
      if (enrolled === true) {
        return res.status(200).json({
          success: true,
          message:
            totalAmount === 0
              ? "Enrolled in free course(s)"
              : "Enrolled (direct enroll mode — Razorpay bypassed for local testing)",
          freeEnrollment: true,
        })
      }
      return
    }

    if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay keys missing in server/.env. Add RAZORPAY_KEY and RAZORPAY_SECRET, or set ALLOW_DIRECT_ENROLL=true for local testing.",
      })
    }

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    }

    try {
      const paymentResponse = await instance.orders.create(options)
      return res.status(200).json({
        success: true,
        data: paymentResponse,
        message: "Order created successfully",
      })
    } catch (razorpayError) {
      console.log("Razorpay order error:", razorpayError)
      const description =
        razorpayError?.error?.description ||
        razorpayError?.message ||
        "Could not initiate order"

      return res.status(400).json({
        success: false,
        message:
          description === "Authentication failed"
            ? "Razorpay authentication failed. Your RAZORPAY_KEY/SECRET are invalid or expired. Create new Test keys at https://dashboard.razorpay.com/app/keys and update server/.env (and REACT_APP_RAZORPAY_KEY). Or set ALLOW_DIRECT_ENROLL=true for local testing."
            : description,
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message || "Could not initiate order",
    })
  }
}

// Verify Razorpay payment from frontend checkout, then enroll
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courses,
    } = req.body
    const userId = req.user.id

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courses
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: missing fields",
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature",
      })
    }

    const enrolled = await enrollStudents(courses, userId, res)
    if (enrolled === true) {
      return res.status(200).json({
        success: true,
        message: "Payment verified and course enrolled",
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.verifySignature = exports.verifyPayment
