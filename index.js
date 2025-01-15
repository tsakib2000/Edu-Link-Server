require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wu5vq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("Edu-Link");
    const userCollection = db.collection("users");
    const sessionCollection = db.collection("sessions");
    const verifyToken = (req, res, next) => {
      console.log(req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });

    //Users related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);
      if (isExist)
        return res.send({ message: "user already exist", insertedId: null });
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    //Get All users
    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    // get single user
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);

      res.send(result);
    });

    //save tutor study session
    app.post("/sessions", async (req, res) => {
      const session = req.body;
      const result = await sessionCollection.insertOne(session);
      res.send(result);
    });
    //get all sessions
    app.get('/sessions',async(req,res)=>{
      const result= await sessionCollection.find().toArray();
      res.send(result)
    })
    //get tutor sessions
    app.get('/sessions/:email',async(req,res)=>{
      const email=req.params.email;
      const query={tutorEmail:email}
     
      const result= await sessionCollection.find(query).toArray();
      
      res.send(result)
    })
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("student is studying");
});

app.listen(port, () => {
  console.log(`student studying on port${port}`);
});
