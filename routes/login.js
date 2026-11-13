import jwt from "jsonwebtoken"
import bcrypyjs from "bcryptjs"
import express from "express"

import connectDB from "../config/db.js"

const db = await connectDB()

const router = express.Router()

router.post("/",async (req,res)=>{

    if (!req.body) return res.status(401).send("Check data of formData!")
        
    const { email , password } = req.body

    const resultCheck = await db.collection("users").findOne({email:email})

   if(!resultCheck) return res.status(404).send("User not founded!")

    const resultCompare = await bcrypyjs.compare(password,resultCheck.password)

    if(!resultCompare) return res.status(401).send("Email or password not correct!")

    const token = await jwt.sign({userID:resultCheck._id},process.env.JWT_SECRET,{expiresIn:"7d"})

     res.cookie("token",token,{
        httpOnly:false,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
     })

    res.json({statue:"success"})

})

export default router
