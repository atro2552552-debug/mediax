import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()

const router = express.Router()

router.post("/", middleware, async (req, res) => {
  try {
    const search = String(req.body?.search || "").trim()
    const specialCharacters = ".*+?^$()|[]{}\\"
    const term = [...search]
      .map((character) => specialCharacters.includes(character) ? "\\" + character : character)
      .join("")
    const filter = term
      ? {
          $or: [
            { fullname: { $regex: term, $options: "i" } },
            { username: { $regex: term, $options: "i" } }
          ]
        }
      : {}
    const limit = Math.min(Math.max(Number(req.body?.limit) || 50, 1), 100)
    const users = await db.collection("users")
      .find(filter)
      .project({ fullname: 1, username: 1, avatar: 1, status: 1, verify: 1 })
      .limit(limit)
      .toArray()

    res.json({ users })
  } catch (error) {
    console.error("Could not search users:", error)
    res.status(500).json({ message: "Could not search users." })
  }
})

export default router
