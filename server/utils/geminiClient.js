/**
 * Calls Google Gemini API (free tier available at https://aistudio.google.com/apikey)
 */
exports.askGemini = async ({ systemPrompt, userMessage, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    const error = new Error(
      "GEMINI_API_KEY is missing. Add it to server/.env from https://aistudio.google.com/apikey"
    )
    error.statusCode = 500
    throw error
  }

  const contents = []

  // Include short chat history for multi-turn conversation
  for (const turn of history.slice(-6)) {
    if (!turn?.role || !turn?.content) continue
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: String(turn.content) }],
    })
  }

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  })

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      data?.error?.message || "Failed to get a response from Gemini"
    const error = new Error(message)
    error.statusCode = response.status
    throw error
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "I could not generate a response. Please try again."

  return reply.trim()
}
