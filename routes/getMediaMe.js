import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()
const router = express.Router()

router.get("/", middleware, async (req, res) => {
  try {
    const posts = await db.collection("posts")
      .find({
        ownerID: String(req.userID),
        file: { $exists: true, $ne: "" }
      })
      .project({ _id: 0, postID: 1, file: 1, type: 1, title: 1, date: 1 })
      .sort({ date: -1 })
      .limit(30)
      .toArray()

    res.json({ posts })
  } catch (error) {
    console.error("Could not load profile media:", error)
    res.status(500).json({ message: "Could not load profile media." })
  }
})

export default router
