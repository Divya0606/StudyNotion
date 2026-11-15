import React, { useEffect, useState } from "react"
import Footer from "../components/common/Footer"
import { useParams } from "react-router-dom"
import { apiConnector } from "../services/apiconnector"
import { categories } from "../services/apis"
import { getCatalogaPageData } from "../services/operations/pageAndComponentData"
import Course_Card from "../components/core/Catalog/Course_Card"
import CourseSlider from "../components/core/Catalog/CourseSlider"

const Catalog = () => {
  const { catalogName } = useParams()
  const [catalogPageData, setCatalogPageData] = useState(null)
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await apiConnector("GET", categories.CATEGORIES_API)
        const match = res?.data?.data?.find(
          (ct) =>
            ct.name.split(" ").join("-").toLowerCase() ===
            catalogName?.toLowerCase()
        )
        if (!match) {
          setError("Category not found")
          setCategoryId("")
          setCatalogPageData(null)
        } else {
          setCategoryId(match._id)
        }
      } catch (err) {
        console.log(err)
        setError("Could not load categories")
      }
      setLoading(false)
    }
    getCategories()
  }, [catalogName])

  useEffect(() => {
    const getCategoryDetails = async () => {
      setLoading(true)
      try {
        const res = await getCatalogaPageData(categoryId)
        setCatalogPageData(res)
        if (!res?.success) {
          setError(res?.message || "No courses found for this category")
        } else {
          setError("")
        }
      } catch (err) {
        console.log(err)
        setError("Could not load catalog page")
      }
      setLoading(false)
    }
    if (categoryId) {
      getCategoryDetails()
    }
  }, [categoryId])

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-richblack-5">
        Loading catalog...
      </div>
    )
  }

  if (error && !catalogPageData?.data) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center text-richblack-5">
        {error}
      </div>
    )
  }

  return (
    <div className="text-white">
      <div className="box-content bg-richblack-800 px-4">
        <div className="mx-auto flex min-h-[160px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent">
          <p className="text-sm text-richblack-300">
            {`Home / Catalog /`}
            <span className="text-yellow-25">
              {catalogPageData?.data?.selectedCategory?.name}
            </span>
          </p>
          <p className="text-3xl text-richblack-5">
            {catalogPageData?.data?.selectedCategory?.name}
          </p>
          <p className="max-w-[870px] text-richblack-200">
            {catalogPageData?.data?.selectedCategory?.description}
          </p>
        </div>
      </div>

      <div className="mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
        <div className="mb-4 text-xl font-semibold">Courses to get you started</div>
        <CourseSlider Courses={catalogPageData?.data?.selectedCategory?.courses} />

        <div className="mb-4 mt-12 text-xl font-semibold">
          Top Courses in {catalogPageData?.data?.selectedCategory?.name}
        </div>
        <CourseSlider Courses={catalogPageData?.data?.differentCategory?.courses} />

        <div className="mb-4 mt-12 text-xl font-semibold">Frequently Bought</div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {catalogPageData?.data?.mostSellingCourses?.slice(0, 4).map((course, index) => (
            <Course_Card course={course} key={index} Height={"h-[300px]"} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Catalog
