import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"
import { v4 as uuid } from "uuid"

const db = await connectDB()
const router = express.Router()

router.post("/", middleware, async (req, res) => {
  try {
    const { title, file, typeFile, security, date } = req.body || {}

    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "Write something before posting." })
    }

    if (file && (typeof file !== "string" || !file.startsWith("https://"))) {
      return res.status(400).json({ message: "Upload the media file first." })
    }

    const post = {
      ownerID: req.userID,
      postID: uuid(),
      title: String(title).trim(),
      date: date || new Date(),
      security: security || "Public"
    }

    if (file) {
      post.file = file
      post.type = typeFile || ""
    }

    await db.collection("posts").insertOne(post)
    res.json({ status: "success" })
  } catch (error) {
    console.error("Could not create post:", error)
    res.status(500).json({ message: "Could not create post." })
  }
})

export default router
