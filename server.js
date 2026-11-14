import { createServer } from "http"
import express from "express"
import { Server } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"
import connectDB from "./config/db.js"

dotenv.config()

const app = express()
const server = createServer(app)
const corsOptions = { origin: true, credentials: true }
const io = new Server(server, { cors: corsOptions })

let db = null
let apiReady = false

app.use(cookieParser())
app.use(cors(corsOptions))
app.use(express.json({ limit: "15mb" }))

app.get("/api/auth/health", (req, res) => {
  res.status(200).json({ status: apiReady ? "success" : "starting", ready: apiReady })
})

app.get("/api/auth/ready", (req, res) => {
  const statusCode = apiReady ? 200 : 503
  res.status(statusCode).json({ status: apiReady ? "success" : "not_ready", ready: apiReady })
})

app.use("/api/auth", (req, res, next) => {
  if (!apiReady) {
    return res.status(503).json({
      status: "starting",
      message: "The API is connecting to the database. Try again shortly."
    })
  }

  next()
})

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
  if (!apiReady || !db) {
    socket.disconnect(true)
    return
  }

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

async function startApi() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is missing from the server environment.")
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing from the server environment.")

  db = await connectDB()
  const { default: authRoutes } = await import("./auth/auth.js")
  app.use("/api/auth", authRoutes)
  apiReady = true
  console.log("Database connected. API routes are ready.")
}

const port = process.env.PORT || 8080

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}.`)
  startApi().catch((error) => {
    console.error("API startup failed:", error)
  })
})
