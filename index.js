import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import { signUp, signIn } from './controllers/users.controller.js';
import { newRecord, showRecords } from './controllers/records.controller.js';

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

try {
    await client.connect();
    console.log("Mongodb connected");
} catch (error) {
    console.log(error); 
}

const db = client.db("mywallet");
export const usersCollection = db.collection("users");
export const recordsCollection = db.collection("records");

app.post("/sign-up", signUp);

app.post("/sign-in", signIn);

app.post("/new-record", newRecord);

app.get("/show-records", showRecords);

app.listen(process.env.PORT, () => console.log(`Server running in port ${process.env.PORT}`));