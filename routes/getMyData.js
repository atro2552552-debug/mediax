import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"
import { ObjectId } from "mongodb"


const db = await connectDB()

const router = express.Router()

router.get("/" , middleware ,async (req,res)=>{

const data = await db.collection("users").findOne({_id:new ObjectId(req.userID)})

if(!data) return res.status(404).json({message:"Profile not found."})

res.json({fullname:data.fullname,username:data.username || "",avatar:data.avatar || "",id:data._id})

})

export default router
