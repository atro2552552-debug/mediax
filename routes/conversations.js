import express from "express"
import { ObjectId } from "mongodb"
import { v4 as uuid } from "uuid"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()
const router = express.Router()

router.get("/", middleware, async (req, res) => {
  try {
    const conversations = await db.collection("conversations")
      .find({ members: String(req.userID) })
      .sort({ updatedAt: -1 })
      .toArray()

    const result = await Promise.all(conversations.map(async (conversation) => {
      const otherID = conversation.members.find((id) => id !== String(req.userID))
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(otherID) },
        { projection: { fullname: 1, username: 1, avatar: 1, status: 1 } }
      )
      return {
        conversationId: conversation.conversationId,
        user: user ? {
          id: user._id,
          fullname: user.fullname,
          username: user.username || "",
          avatar: user.avatar || "",
          status: user.status || "offline"
        } : null,
        lastMessage: conversation.lastMessage || null
      }
    }))

    res.json({ conversations: result.filter((item) => item.user) })
  } catch (error) {
    console.error("Could not load conversations:", error)
    res.status(500).json({ message: "Could not load conversations." })
  }
})

router.post("/start", middleware, async (req, res) => {
  try {
    const myID = String(req.userID)
    const userID = String(req.body?.userID || "")

    if (!ObjectId.isValid(userID) || userID === myID) {
      return res.status(400).json({ message: "Choose a valid user." })
    }

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userID) },
      { projection: { fullname: 1, username: 1, avatar: 1, status: 1 } }
    )

    if (!user) return res.status(404).json({ message: "User not found." })

    let conversation = await db.collection("conversations").findOne({
      members: { $all: [myID, userID], $size: 2 }
    })

    if (!conversation) {
      conversation = {
        conversationId: uuid(),
        members: [myID, userID],
        lastMessage: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await db.collection("conversations").insertOne(conversation)
    }

    res.json({
      conversationId: conversation.conversationId,
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username || "",
        avatar: user.avatar || "",
        status: user.status || "offline"
      }
    })
  } catch (error) {
    console.error("Could not start conversation:", error)
    res.status(500).json({ message: "Could not start conversation." })
  }
})

router.get("/:conversationId/messages", middleware, async (req, res) => {
  try {
    const conversation = await db.collection("conversations").findOne({
      conversationId: req.params.conversationId,
      members: String(req.userID)
    })

    if (!conversation) return res.status(404).json({ message: "Conversation not found." })

    const messages = await db.collection("messages")
      .find({ conversationId: conversation.conversationId })
      .project({
        _id: 0,
        messageId: 1,
        conversationId: 1,
        senderId: 1,
        receiverId: 1,
        text: 1,
        replyTo: 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    res.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Could not load messages:", error)
    res.status(500).json({ message: "Could not load messages." })
  }
})

export default router
