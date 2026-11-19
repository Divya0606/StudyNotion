import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import { Autoplay, FreeMode, Navigation, Pagination } from "swiper/modules"

import CourseCard from "./Course_Card"

const CourseSlider = ({ Courses }) => {
  return (
    <>
      {Courses?.length ? (
        <Swiper
          slidesPerView={1}
          spaceBetween={24}
          loop={Courses.length > 1}
          modules={[FreeMode, Pagination, Autoplay, Navigation]}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          breakpoints={{
            1024: { slidesPerView: 3 },
          }}
          className="max-h-[30rem]"
        >
          {Courses.map((course, index) => (
            <SwiperSlide key={course._id || index}>
              <CourseCard course={course} Height={"h-[250px]"} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-richblack-300">No Course Found</p>
      )}
    </>
  )
}

export default CourseSlider
