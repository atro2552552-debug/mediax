import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export default async function middleware(req,res,next){

const Token = req.cookies.token

if(!Token) return res.status(404).send("You not login!")

const playload = await jwt.verify(Token,process.env.JWT_SECRET)

if(!playload) return res.status(401).send("Token expired!")
    
const ID = playload.userID

req.userID = ID

next()

}
