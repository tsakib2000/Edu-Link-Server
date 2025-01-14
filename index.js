require('dotenv').config()
const express=require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion } = require('mongodb');
const port =process.env.PORT || 5000
const app=express()

app.use(express.json())
app.use(cors())


const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.wu5vq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db('Edu-Link')
// jwt api
app.post('/jwt',async(req,res)=>{
    const user = req.body;
 const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"5h"})
 res.send({token});
})

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',async(req,res)=>{
    res.send('student is studying')
})

app.listen(port,()=>{
    console.log(`student studying on port${port}`);
})