import { toast } from "react-hot-toast"
import { studentEndpoints } from "../apis"
import { apiConnector } from "../apiconnector"
import rzpLogo from "../../assets/Logo/Logo-Small-Light.png"
import { setPaymentLoading } from "../../slices/courseSlice"
import { resetCart } from "../../slices/cartSlice"

const { COURSE_PAYMENT_API, COURSE_VERIFY_API } = studentEndpoints

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
  const toastId = toast.loading("Loading...")
  try {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js")
    if (!res) {
      toast.error("Razorpay SDK failed to load. Check your internet.")
      toast.dismiss(toastId)
      return
    }

    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      {
        Authorization: `Bearer ${token}`,
        Authorisation: `Bearer ${token}`,
      }
    )

    if (!orderResponse?.data?.success) {
      throw new Error(orderResponse?.data?.message || "Could not create order")
    }

    // Free courses enrolled on backend already
    if (orderResponse.data.freeEnrollment) {
      toast.success("Enrolled successfully")
      dispatch(resetCart())
      navigate("/dashboard/enrolled-courses")
      toast.dismiss(toastId)
      return
    }

    const orderData = orderResponse.data.data
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY

    if (!razorpayKey) {
      throw new Error(
        "REACT_APP_RAZORPAY_KEY is missing in frontend .env. Restart after adding it."
      )
    }

    const options = {
      key: razorpayKey,
      currency: orderData.currency,
      amount: `${orderData.amount}`,
      order_id: orderData.id,
      name: "StudyNotion",
      description: "Thank you for purchasing the course",
      image: rzpLogo,
      prefill: {
        name: `${userDetails.firstName} ${userDetails.lastName}`,
        email: userDetails.email,
      },
      handler: function (response) {
        verifyPayment(
          { ...response, courses },
          token,
          navigate,
          dispatch
        )
      },
    }

    const paymentObject = new window.Razorpay(options)
    paymentObject.open()
    paymentObject.on("payment.failed", function () {
      toast.error("Payment failed. Please try again.")
    })
  } catch (error) {
    console.log("BUY COURSE ERROR............", error)
    toast.error(error?.response?.data?.message || error.message || "Buy failed")
  }
  toast.dismiss(toastId)
}

async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment...")
  dispatch(setPaymentLoading(true))
  try {
    const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
      Authorization: `Bearer ${token}`,
      Authorisation: `Bearer ${token}`,
    })

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Verification failed")
    }

    toast.success("Payment successful. You are enrolled!")
    navigate("/dashboard/enrolled-courses")
    dispatch(resetCart())
  } catch (error) {
    console.log("PAYMENT VERIFY ERROR............", error)
    toast.error(
      error?.response?.data?.message || error.message || "Payment verification failed"
    )
  }
  toast.dismiss(toastId)
  dispatch(setPaymentLoading(false))
}
