import express from "express"
import connectDB from "../config/db.js"
import { ObjectId } from "mongodb"
import middleware from "../middleware/middleware.js"

const db = await connectDB()

const router = express.Router()

async function getReactionCount(collectionName, postId) {
  const records = await db.collection(collectionName).find({ postId }).project({ counter: 1 }).toArray()
  return records.reduce((total, record) => total + (Number(record.counter) || 1), 0)
}


router.post("/" , middleware ,async (req,res)=>{

    const posts = []

   const skipPost = Math.max(Number(req.body?.skipPost) || 0, 0)
   const resultPosts = await db.collection("posts")
     .find({security: "Public"})
     .sort({date: -1})
     .skip(skipPost)
     .limit(10)
     .toArray()

   let postsData = resultPosts

  for(const post of postsData){
      
  const ownerPost = await db.collection("users").findOne({_id: new ObjectId(post.ownerID)})

  const isfollow = await db.collection("followers").findOne({ownerId:post.ownerID,followerId:req.userID})

  const [likeCount, shareCount] = await Promise.all([
    getReactionCount("likes", post.postID),
    getReactionCount("shares", post.postID)
  ])

   posts.push({
      owner:{
         id:ownerPost._id,
         fullname:ownerPost.fullname,
         username:ownerPost.username || "",
         avatar:ownerPost.avatar,
         verify:ownerPost?.verify ? true : false,
         status:ownerPost?.status
     },
     postID:post.postID,
     title:post.title,
     date:post.date,
     file:post.file,
     type:post.type,

     reacts:{
       like:likeCount,
       share:shareCount
     },
     is_follow:isfollow ? true : false
})

   }

   res.json({data:posts})

})

export default router
