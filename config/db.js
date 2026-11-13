import dotenv from "dotenv"
import { MongoClient } from "mongodb"

dotenv.config()

let db = null
let connection = null

export default function connectDB() {
  if (db) return Promise.resolve(db)
  if (connection) return connection

  if (!process.env.MONGO_URL) {
    return Promise.reject(new Error("MONGO_URL is missing from the server environment."))
  }

  const client = new MongoClient(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 15000
  })

  connection = client.connect()
    .then(() => {
      db = client.db("MediaX")
      return db
    })
    .catch((error) => {
      connection = null
      throw error
    })

  return connection
}
