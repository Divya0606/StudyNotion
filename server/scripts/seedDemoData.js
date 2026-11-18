/**
 * Seeds demo categories + published courses so Catalog and AI Tutor work
 * on a fresh local MongoDB.
 *
 * Run: node scripts/seedDemoData.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const User = require("../models/User")
const Profile = require("../models/Profile")
const Category = require("../models/Category")
const Course = require("../models/Course")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")

const DEMO_VIDEO =
  "https://res.cloudinary.com/dlnlkmuog/video/upload/v1700000000/demo.mp4"

async function createLecture(title, description) {
  return SubSection.create({
    title,
    description,
    timeDuration: "10",
    videoUrl: DEMO_VIDEO,
  })
}

async function createSectionWithLectures(sectionName, lectures) {
  const subDocs = []
  for (const lecture of lectures) {
    subDocs.push(await createLecture(lecture.title, lecture.description))
  }
  return Section.create({
    sectionName,
    subSection: subDocs.map((s) => s._id),
  })
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URL)
  console.log("Connected to", process.env.MONGODB_URL)

  // Instructor account (login with this after seeding)
  const instructorEmail = "instructor@studynotion.local"
  let instructor = await User.findOne({ email: instructorEmail })

  if (!instructor) {
    const profile = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: "Demo instructor",
      contactNumber: null,
    })
    const hashedPassword = await bcrypt.hash("Instructor@123", 10)
    instructor = await User.create({
      firstName: "Demo",
      lastName: "Instructor",
      email: instructorEmail,
      password: hashedPassword,
      accountType: "Instructor",
      additionalDetails: profile._id,
      image: "https://api.dicebear.com/5.x/initials/svg?seed=Demo Instructor",
      courses: [],
    })
    console.log("Created instructor:", instructorEmail, "/ Instructor@123")
  } else {
    console.log("Instructor already exists:", instructorEmail)
  }

  // Categories
  const categorySpecs = [
    {
      name: "Web Development",
      description: "HTML, CSS, JavaScript, React and more",
    },
    {
      name: "Python",
      description: "Python programming from basics to projects",
    },
    {
      name: "Data Science",
      description: "Data analysis, ML basics and tools",
    },
  ]

  const categories = {}
  for (const spec of categorySpecs) {
    let cat = await Category.findOne({ name: spec.name })
    if (!cat) {
      cat = await Category.create({ ...spec, courses: [] })
      console.log("Created category:", spec.name)
    }
    categories[spec.name] = cat
  }

  const courseSpecs = [
    {
      courseName: "React.js Complete Guide",
      courseDescription:
        "Learn React from scratch — components, hooks, routing, and building real UIs.",
      whatYouWillLearn:
        "Build SPA apps with React, use hooks, manage state, and work with React Router.",
      price: 999,
      tag: ["React", "JavaScript", "Frontend"],
      category: "Web Development",
      instructions: ["Basic JavaScript knowledge", "A laptop with VS Code"],
      sections: [
        {
          sectionName: "Getting Started",
          lectures: [
            {
              title: "What is React?",
              description: "Introduction to React and why it is popular.",
            },
            {
              title: "Setup and JSX",
              description: "Create a React app and understand JSX syntax.",
            },
          ],
        },
        {
          sectionName: "Core Concepts",
          lectures: [
            {
              title: "Components and Props",
              description: "Build reusable components and pass data with props.",
            },
            {
              title: "State and Hooks",
              description: "useState, useEffect and basic state management.",
            },
          ],
        },
      ],
    },
    {
      courseName: "Python for Beginners",
      courseDescription:
        "Start coding in Python — variables, loops, functions, and mini projects.",
      whatYouWillLearn:
        "Write Python programs, use data structures, and solve beginner problems.",
      price: 499,
      tag: ["Python", "Programming"],
      category: "Python",
      instructions: ["No prior coding experience needed"],
      sections: [
        {
          sectionName: "Python Basics",
          lectures: [
            {
              title: "Installing Python",
              description: "Install Python and run your first script.",
            },
            {
              title: "Variables and Data Types",
              description: "Numbers, strings, booleans and type conversion.",
            },
          ],
        },
        {
          sectionName: "Control Flow",
          lectures: [
            {
              title: "If-Else and Loops",
              description: "Make decisions and repeat tasks with loops.",
            },
            {
              title: "Functions",
              description: "Write reusable functions with parameters.",
            },
          ],
        },
      ],
    },
    {
      courseName: "Data Science Foundations",
      courseDescription:
        "Understand data science workflow, NumPy/Pandas basics, and simple ML ideas.",
      whatYouWillLearn:
        "Clean data, explore datasets, and understand basic ML concepts.",
      price: 1299,
      tag: ["Data Science", "Pandas", "ML"],
      category: "Data Science",
      instructions: ["Basic Python recommended"],
      sections: [
        {
          sectionName: "Intro to Data Science",
          lectures: [
            {
              title: "What is Data Science?",
              description: "Roles, tools, and the data science lifecycle.",
            },
            {
              title: "Working with Data",
              description: "CSV files, tables, and basic cleaning steps.",
            },
          ],
        },
      ],
    },
  ]

  for (const spec of courseSpecs) {
    const existing = await Course.findOne({ courseName: spec.courseName })
    if (existing) {
      console.log("Course already exists:", spec.courseName)
      continue
    }

    const sectionIds = []
    for (const section of spec.sections) {
      const sectionDoc = await createSectionWithLectures(
        section.sectionName,
        section.lectures
      )
      sectionIds.push(sectionDoc._id)
    }

    const category = categories[spec.category]
    const course = await Course.create({
      courseName: spec.courseName,
      courseDescription: spec.courseDescription,
      instructor: instructor._id,
      whatYouWillLearn: spec.whatYouWillLearn,
      courseContent: sectionIds,
      price: spec.price,
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      tag: spec.tag,
      category: category._id,
      studentsEnrolled: [],
      instructions: spec.instructions,
      status: "Published",
    })

    await Category.findByIdAndUpdate(category._id, {
      $push: { courses: course._id },
    })
    await User.findByIdAndUpdate(instructor._id, {
      $push: { courses: course._id },
    })

    console.log("Created course:", spec.courseName)
  }

  const published = await Course.countDocuments({ status: "Published" })
  const cats = await Category.countDocuments()
  console.log("\nDone. Published courses:", published, "| Categories:", cats)
  console.log("AI Tutor and Catalog should show these after refresh.")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
