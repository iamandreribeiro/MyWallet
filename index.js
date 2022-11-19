import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import Joi from 'joi';
import cors from 'cors';
import bcrypt from 'bcrypt';

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
    const {name, email, password, confirmPassword} = req.body;
    console.log(name, email, password, confirmPassword);

    const validation = Joi.object({
        name: Joi.string().required().min(3),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required().valid(password)
    });

    const validateSignUp = validation.validate({name, email, password, confirmPassword}, {abortEarly: false});

    if(validateSignUp.error) {
        res.status(422).send(validateSignUp.error.details.map(value => value.message));
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

app.listen(process.env.PORT, () => console.log(`Server running in port ${process.env.PORT}`));