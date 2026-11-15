import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { IoClose, IoSend } from "react-icons/io5"
import { BsRobot } from "react-icons/bs"
import { askCourseTutor, fetchTutorCourses } from "../../services/operations/aiAPI"

function CourseTutorChat() {
  const { token } = useSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your StudyNotion AI Tutor. Pick a course and ask me about its content, curriculum, or concepts.",
    },
  ])
  const bottomRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const data = await fetchTutorCourses()
      setCourses(data)
      if (data?.length) {
        setCourseId(data[0]._id)
      }
    })()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    if (!token) return
    if (!courseId) return

    const historyForApi = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")
    setLoading(true)

    const data = await askCourseTutor({
      courseId,
      message: trimmed,
      history: historyForApi,
      token,
    })

    if (data?.reply) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I could not answer that right now. Please try again in a moment.",
        },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-richblack-600 bg-richblack-800 shadow-2xl md:w-[26rem]">
          <div className="flex items-center justify-between bg-richblack-700 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-richblack-5">
                StudyNotion AI Tutor
              </p>
              <p className="text-xs text-richblack-300">
                For students & instructors · uses course content
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-richblack-200 hover:bg-richblack-600"
              aria-label="Close chat"
            >
              <IoClose size={20} />
            </button>
          </div>

          {!token ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <BsRobot className="text-4xl text-yellow-50" />
              <p className="text-sm text-richblack-200">
                Please log in to chat with the AI Course Tutor.
              </p>
              <Link
                to="/login"
                className="rounded-md bg-yellow-50 px-4 py-2 text-sm font-medium text-richblack-900"
              >
                Log in
              </Link>
            </div>
          ) : (
            <>
              <div className="border-b border-richblack-600 px-3 py-2">
                <label className="mb-1 block text-xs text-richblack-300">
                  Select course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value)
                    setMessages([
                      {
                        role: "assistant",
                        content:
                          "Course switched. Ask me anything about this course.",
                      },
                    ])
                  }}
                  className="w-full rounded-md border border-richblack-500 bg-richblack-900 px-2 py-2 text-sm text-richblack-5 outline-none"
                >
                  {courses.length === 0 ? (
                    <option value="">No published courses yet</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.courseName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-yellow-50 text-richblack-900"
                          : "bg-richblack-700 text-richblack-25"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <p className="text-xs text-richblack-400">Tutor is thinking...</p>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-richblack-600 p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this course..."
                  className="flex-1 rounded-md border border-richblack-500 bg-richblack-900 px-3 py-2 text-sm text-richblack-5 outline-none placeholder:text-richblack-400"
                />
                <button
                  type="submit"
                  disabled={loading || !courseId || !input.trim()}
                  className="rounded-md bg-yellow-50 p-2 text-richblack-900 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <IoSend size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-3 text-sm font-semibold text-richblack-900 shadow-lg hover:bg-yellow-100"
      >
        <BsRobot size={18} />
        {open ? "Close" : "AI Tutor"}
      </button>
    </div>
  )
}

export default CourseTutorChat
