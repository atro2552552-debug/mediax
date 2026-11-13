import express from "express"
import { ObjectId } from "mongodb"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()
const router = express.Router()

router.patch("/", middleware, async (req, res) => {
  try {
    const fullname = String(req.body?.fullname || "").trim()
    const username = String(req.body?.username || "").trim().replace(/^@/, "").toLowerCase()
    const avatar = req.body?.avatar

    if (fullname.length < 2 || fullname.length > 60) {
      return res.status(400).json({ message: "Name must be between 2 and 60 characters." })
    }

    if (!/^[a-zA-Z0-9._]{2,30}$/.test(username)) {
      return res.status(400).json({ message: "Username must be 2–30 characters and use letters, numbers, dots, or underscores." })
    }

    const userID = new ObjectId(req.userID)
    const existingUser = await db.collection("users").findOne({ username, _id: { $ne: userID } })

    if (existingUser) {
      return res.status(409).json({ message: "That username is already taken." })
    }

    const updates = { fullname, username }

    if (avatar) {
      if (typeof avatar !== "string" || !avatar.startsWith("https://")) {
        return res.status(400).json({ message: "Choose a valid image file." })
      }

      updates.avatar = avatar
    }

    const updateResult = await db.collection("users").updateOne(
      { _id: userID },
      { $set: updates }
    )

    if (!updateResult.matchedCount) {
      return res.status(404).json({ message: "Profile not found." })
    }

    const profile = await db.collection("users").findOne(
      { _id: userID },
      { projection: { fullname: 1, username: 1, avatar: 1 } }
    )

    res.json({
      status: "success",
      profile: {
        id: profile._id,
        fullname: profile.fullname,
        username: profile.username,
        avatar: profile.avatar || ""
      }
    })
  } catch (error) {
    console.error("Profile update failed:", error)
    res.status(500).json({ message: "Could not update the profile." })
  }
})

export default router
