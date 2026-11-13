import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()

const router = express.Router()

router.post("/", middleware, async (req, res) => {
  const { type, postId } = req.body

  
  const collection = db.collection(type === "like" ? "likes" : "shares")
  const userId = String(req.userID)

  await collection.updateOne(
    { postId, userId },
    { $inc: { counter: 1 } },
    { upsert: true }
  )

  return res.json({ status: "success" })
})

export default router
