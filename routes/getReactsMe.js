import express from "express"
import connectDB from "../config/db.js"
import { ObjectId } from "mongodb"
import middleware from "../middleware/middleware.js"

const db = await connectDB()

const router = express.Router()

async function getReactionCount(myID , res) {
  
const postsCount = await db.collection("posts").find({ownerID:myID}).toArray()
const followersCount = await db.collection("followers").find({ownerId:myID}).toArray()

let countLikes = 0;

 for(const post of postsCount){

  const counters =  await db.collection("likes").findOne({postId:post.postID})

  countLikes += counters ? counters.counter : 0

 }

res.json({likes:countLikes,followers:followersCount.length,posts:postsCount.length})

}

router.get("/" , middleware ,async (req,res)=>{

getReactionCount(req.userID , res)

})

export default router