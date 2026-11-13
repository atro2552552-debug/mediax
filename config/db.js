import dotenv from "dotenv"
import { MongoClient } from "mongodb"

dotenv.config()

let db = null;

export default async function connectDB(){

   if (db) return db

    try {

     const client = new MongoClient(process.env.MONGO_URL)

     await client.connect()
     db = client.db("MediaX")
     
     return db

    }catch(err){

        console.log(err)
        throw err

    }
    
}