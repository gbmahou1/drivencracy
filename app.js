import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors())
app.use(json())


app.post('/pool', async (req, res) => {
    
    try{ 
    const {title, expireAt} = req.body;
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect()

    const poolCollection = mongoClient.db("drivencracy").collection("pool");

    let expire = expireAt;

    if (!title)
    {
        return res.sendStatus(422);
    }

    if (!expire)
    {
        expire = dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm');
    }

    await poolCollection.insertOne({title, expireAt: expire});

    mongoClient.close();
    res.sendStatus(201);
    }
    catch (error)
    {
        console.log(error)
        res.sendStatus(500);
    }
})


app.get('/pool', async (req, res) => {
    try {

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect() ;

    const poolCollection = mongoClient.db("drivencracy").collection("pool");
    const pool = await poolCollection.find({}).toArray();

    mongoClient.close();
    res.send(pool);

    }
    catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
})


app.post('/choice', async (req, res) => {
    
    try{ 
    const {title, poolId} = req.body;
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect()

    const poolCollection = mongoClient.db("drivencracy").collection("pool");
    const choiceCollection = mongoClient.db("drivencracy").collection("choice");

    const pool = await poolCollection.findOne({ _id: new ObjectId (poolId) });   

    if (!pool) 
    {
        return res.sendStatus(404);
    }

    if (!title)
    {
        return res.sendStatus(422);
    }

    const existingChoice = await choiceCollection.findOne({ title });

    if (existingChoice) 
    {
        return res.sendStatus(409);
    }

    const isExpiredPool = dayjs().isAfter(pool.expireAt);

    if (isExpiredPool) 
    {
        return res.sendStatus(403);
    }

    await choiceCollection.insertOne({title, poolId: new ObjectId (poolId)});

    mongoClient.close();
    res.sendStatus(201);
    }
    catch (error)
    {
        console.log(error)
        res.sendStatus(500);
    }
})


app.get('/pool/:id/choice', async (req, res) => {
    try {

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect() ;

    const poolCollection = mongoClient.db("drivencracy").collection("pool");
    const choiceCollection = mongoClient.db("drivencracy").collection("choice");

    const poolExists = await poolCollection.findOne({ _id: new ObjectId (req.params.id) });

    if (!poolExists)
    {
        return res.sendStatus(404);
    }

    const choices = await choiceCollection.find({poolId: new ObjectId (req.params.id) }).toArray();

    mongoClient.close();
    res.send(choices);

    }
    catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
})


app.post('/choice/:id/vote', async (req, res) => {

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();

        const poolCollection = mongoClient.db("drivencracy").collection("pool");
        const choiceCollection = mongoClient.db("drivencracy").collection("choice");
        const voteCollection = mongoClient.db("drivencracy").collection("vote");

        const choice = await choiceCollection.findOne({_id: new ObjectId (req.params.id) });

        if (!choice)
        {
            return res.sendStatus(404);
        }

        const pool = await poolCollection.findOne({_id: new ObjectId (choice.poolId)})
        const isPoolExpired = dayjs().isAfter(pool.expireAt)

        if (isPoolExpired)
        {
            return res.sendStatus(403);
        }

        await voteCollection.insertOne({createdAt: dayjs().format('YYYY-MM-DD HH:mm'), choiceId: new ObjectId (req.params.id)});


        mongoClient.close();
        res.sendStatus(201);
    }
    catch (error){
        console.log(error)
        res.sendStatus(500);
    }
})


app.get('/pool/:id/result', async (req, res) => {

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();

        const poolCollection = mongoClient.db("drivencracy").collection("pool");
        const voteCollection = mongoClient.db("drivencracy").collection("vote");
        const choiceCollection = mongoClient.db("drivencracy").collection("choice");

        const {id: poolId} = req.params;
        const pool = await poolCollection.findOne({_id: new ObjectId (poolId)})
        const choices = await choiceCollection.find({poolId: new ObjectId (poolId) }).toArray();
        let largestVoteTitle;
        let largestVotes = 0;

        
        for (let i=0; i<choices.length; i++)
        {
            
            const votes = await voteCollection.find({choiceId: choices[i]._id}).toArray();

            if (votes.length > largestVotes)
            {
                largestVotes = votes.length;
                largestVoteTitle = choices[i].title;
            }
        }


        mongoClient.close();

        res.send(
            {
                _id: pool._id,
                title: pool.title,
                expireAt: pool.expireAt,
                result: {
                    title: largestVoteTitle,
                    votes: largestVotes
                }})
    }
    catch (error) {
        console.log(error)
        res.sendStatus(500);

    }
})



app.get('/choice', async (req, res) => {
    try {

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect() ;
        
    const choiceCollection = mongoClient.db("drivencracy").collection("choice");
    const choice = await choiceCollection.find({}).toArray();

    mongoClient.close();
    res.send(choice);

    }
    catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
})

app.get('/vote', async (req, res) => {
    try {

    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect() ;
        
    const voteCollection = mongoClient.db("drivencracy").collection("vote");
    const votes = await voteCollection.find({}).toArray();

    mongoClient.close();
    res.send(votes);

    }
    catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
})


app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT)
})