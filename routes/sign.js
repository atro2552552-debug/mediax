import express from "express"
import bcrypyjs from "bcryptjs"

import connectDB from "../config/db.js"

const db = await connectDB()

const router = express.Router()

router.post("/",async (req,res)=>{

    if (!req.body) return res.status(401).send("Check data of formData!")
        
    const { fullname , email , password } = req.body

    const DataUser = {
        fullname:fullname,
        email:email,
        status:"online"
    }

    const resultCheck = await db.collection("users").findOne({email:email})

    if(resultCheck) return res.status(500).send("User already found!")

    const passHash = await bcrypyjs.hash(password,10)

    DataUser["password"] = passHash

    const resultSign = await db.collection("users").insertOne(DataUser)

    res.send("success")


})

export default router

