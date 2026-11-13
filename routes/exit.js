import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"
import { ObjectId } from "mongodb"

const db = await connectDB()
const router = express.Router()

router.post("/close" , middleware ,async (req,res)=>{

await db.collection("users").updateOne(
  { _id: new ObjectId(req.userID) },
  { $set: { status: "offline" } }
)


})

router.post("/open" , middleware ,async (req,res)=>{

await db.collection("users").updateOne(
  { _id: new ObjectId(req.userID) },
  { $set: { status: "online" } }
)


})

export default router