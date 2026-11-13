import express from "express"
import connectDB from "../config/db.js"
import middleware from "../middleware/middleware.js"

const db = await connectDB()

const router = express.Router()

router.post("/" , middleware ,async (req,res)=>{

 const result = await db.collection("followers").insertOne({ownerId:req.body.ownerID,followerId:req.userID})

 if (result) res.send("success")

})

export default router