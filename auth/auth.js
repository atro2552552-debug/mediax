import express from "express"

import Sign from "../routes/sign.js"
import Login from "../routes/login.js"
import GetPosts from "../routes/getPosts.js"
import AddPost from "../routes/addPost.js"
import GetMyData from "../routes/getMyData.js"
import UpdateReacts from "../routes/updateReacts.js"
import GetUsers from "../routes/getUsers.js"
import AddFollower from "../routes/addFollow.js"
import ExitPage from "../routes/exit.js"
import GetReactsMe from "../routes/getReactsMe.js"
import UpdateProfile from "../routes/updateProfile.js"
import GetMediaMe from "../routes/getMediaMe.js"
import Conversations from "../routes/conversations.js"

const router = express.Router()


router.get("/health",(req,res)=>{

res.status(200).json({status:"success"})

})


router.use("/sign",Sign)
router.use("/login",Login)
router.use("/getPosts",GetPosts)
router.use("/addPost",AddPost)
router.use("/getMyData",GetMyData)
router.use("/updateReacts",UpdateReacts)
router.use("/getUsers",GetUsers)
router.use("/addFollower",AddFollower)
router.use("/exit",ExitPage)
router.use("/getReactsMe",GetReactsMe)
router.use("/updateProfile",UpdateProfile)
router.use("/getMediaMe",GetMediaMe)
router.use("/conversations",Conversations)

export default router
