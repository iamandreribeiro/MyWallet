import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import Joi from 'joi';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

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

app.post("/sign-up", (req, res) => {
    const {name, email, password, passwordConfirmation} = req.body;

    const validation = Joi.object({
        name: Joi.string().required().min(3),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        passwordConfirmation: Joi.string().required().valid(password)
    });

    const validateSignUp = validation.validate({name, email, password, passwordConfirmation}, {abortEarly: false});

    if(validateSignUp.error) {
        return res.status(422).send(validateSignUp.error.details.map(value => value.message));
    } else {
        db.collection("users").find({email}).toArray().then((user) => {
            if(user.length > 0) {
                return res.sendStatus(409);
            } else {
                const encrypt = bcrypt.hashSync(password, 10);
                db.collection("users").insertOne({
                    name: name,
                    email: email,
                    password: encrypt
                });

                return res.sendStatus(201);
            }
        });
    }    
});

app.post("/sign-in", async (req, res) => {
    const {email, password} = req.body;

    const user = await db.collection("users").findOne({email});

    if(user && bcrypt.compareSync(password, user.password)) {        
        return res.status(200).send(user);
    } else {
        return res.sendStatus(404);
    }
});

app.post("/new-record", (req, res) => {
    const {value, description, email, type} = req.body;

    const validation = Joi.object({
        value: Joi.number().required(),
        description: Joi.string().required(),
        email: Joi.string().email().required(),
        type: Joi.string().valid("input", "output")
    });

    const validateRecord = validation.validate(req.body, {abortEarly: false});

    if(validateRecord.error) {
        return res.status(422).send(validateRecord.error.details.map(value => value.message));
    } else {
        db.collection("users").findOne({email}).then((user) => {
            if(user) {
                db.collection("records").insertOne({
                    date: dayjs().format('DD/MM'),
                    value: value,
                    description: description,
                    email: email,
                    type: type
                });

                return res.sendStatus(201);
            } else {
                return res.sendStatus(404);
            }
        });        
    }
});

app.get("/show-records", async (req, res) => {
    const {email} = req.headers;
    const filteredRecords = [];
    const user = await db.collection("users").findOne({email});

    await db.collection("records").find({}).toArray().then((records) => {
        records.forEach((record) => {
            if(record.email === email) {
                filteredRecords.push(record);
            }
        });
    });

    return res.status(201).send({filteredRecords, user});
});

app.listen(process.env.PORT, () => console.log(`Server running in port ${process.env.PORT}`));