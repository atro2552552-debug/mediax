import { createServer } from "http"
import express from "express"
import { Server } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"
import connectDB from "./config/db.js"


import authRoutes from "./auth/auth.js"

dotenv.config()

const app = express()
const server = createServer(app)

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost,https://localhost")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error("Origin not allowed by CORS"))
  },
  credentials: true
}

const io = new Server(server, {
  cors: corsOptions
})
const db = await connectDB()

app.use(cookieParser())
app.use(cors(corsOptions))
app.use(express.json({limit:"15mb"}))
app.use("/api/auth",authRoutes)

io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie || ""
    const tokenCookie = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("token="))
    const token = tokenCookie ? decodeURIComponent(tokenCookie.slice(6)) : ""
    const user = jwt.verify(token, process.env.JWT_SECRET)

    socket.userID = String(user.userID)
    next()
  } catch {
    next(new Error("Not authenticated"))
  }
})

io.on("connection", (socket) => {

  console.log("connection started");

  const userID = socket.userID
  socket.join(userID)

  socket.on("sendMessage", async (data, done = () => {}) => {
    try {
      const conversation = await db.collection("conversations").findOne({
        conversationId: data?.conversationId,
        members: userID
      })

      if (!conversation) return done({ error: "Conversation not found." })

      const text = String(data.text || "").trim()
      const replyTo = data.replyTo || null

      if (!text || text.length > 3000) return done({ error: "Write a message under 3000 characters." })

      const receiverId = conversation.members.find((member) => member !== userID)
      const createdAt = new Date()
      const message = {
        messageId: uuid(),
        conversationId: conversation.conversationId,
        senderId: userID,
        receiverId,
        text,
        replyTo,
        createdAt
      }

      await db.collection("messages").insertOne(message)
      await db.collection("conversations").updateOne(
        { conversationId: conversation.conversationId },
        {
          $set: {
            lastMessage: { text, senderId: userID, createdAt },
            updatedAt: createdAt
          }
        }
      )

      io.to(userID).emit("newMessage", message)
      io.to(receiverId).emit("newMessage", message)

      done({ status: "success" })
    } catch (error) {
      console.error("Could not send message:", error)
      done({ error: "Could not send message." })
    }
  })

})


server.listen(process.env.PORT)
