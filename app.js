import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors())
app.use(json())


app.post('/pool', async (req, res) => {

    const pool = req.body;
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect()

    const poolCollection = mongoClient.db("drivencracy").collection("pool");

    let expire = pool.expireAt;

    if (pool.title == "")
    {
        return res.sendStatus(422);
    }

    if (expire == "")
    {
        expire = dayjs().add(30, 'day');
    }

    await poolCollection.insertOne({title: pool.title, expireAt: expire});

    mongoClient.close();
    res.sendStatus(201);
})

app.listen(5000, () => {
    console.log("Listening on 5000")
})