import { usersCollection, recordsCollection } from "../index.js"
import Joi from 'joi';
import dayjs from 'dayjs';

export async function newRecord(req, res) {
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
        usersCollection.findOne({email}).then((user) => {
            if(user) {
                recordsCollection.insertOne({
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
}

export async function showRecords(req, res) {
    const {email} = req.headers;
    const filteredRecords = [];
    const user = await usersCollection.findOne({email});

    await recordsCollection.find({}).toArray().then((records) => {
        records.forEach((record) => {
            if(record.email === email) {
                filteredRecords.push(record);
            }
        });
    });

    return res.status(201).send({filteredRecords, user});
}