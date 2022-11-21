import bcrypt from 'bcrypt';
import { usersCollection } from "../index.js";
import Joi from 'joi';

export async function signUp(req,res) {
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
        usersCollection.find({email}).toArray().then((user) => {
            if(user.length > 0) {
                return res.sendStatus(409);
            } else {
                const encrypt = bcrypt.hashSync(password, 10);
                usersCollection.insertOne({
                    name: name,
                    email: email,
                    password: encrypt
                });

                return res.sendStatus(201);
            }
        });
    }
}

export async function signIn(req, res) {
    const {email, password} = req.body;

    const user = await usersCollection.findOne({email});

    if(user && bcrypt.compareSync(password, user.password)) {        
        return res.status(200).send(user);
    } else {
        return res.sendStatus(404);
    }
}