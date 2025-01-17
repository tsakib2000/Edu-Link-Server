require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const materialCollection = db.collection("materials");

    //Verify JWT token
    const verifyToken = (req, res, next) => {
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

    //verify user IsAdmin
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req?.decoded?.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user.role === "admin";
      }
      res.send({ admin });
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
    //update user to admin
    app.patch('/user/:id',async(req,res)=>{
const role=req.body;
const id=req.params.id;
const query={_id:new ObjectId(id)};
const updateRole={
  $set:role
}
const result = await userCollection.updateOne(query,updateRole)
res.send(result)
    })
    //Get All users
    app.get("/users", verifyToken, async (req, res) => {
      const search =req.query.search;
      let query={};
      query={
        email:{
          $regex:String(search),
          $options:'i',
        }
      }
   
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    // get single user
    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);

      res.send(result);
    });

    //save tutor study session
    app.post("/sessions", verifyToken, async (req, res) => {
      const session = req.body;
      const result = await sessionCollection.insertOne(session);
      res.send(result);
    });
    //get all sessions
    app.get("/sessions", verifyToken, async (req, res) => {
      const result = await sessionCollection.find().toArray();
      res.send(result);
    });
    //get approved sessions
    app.get("/session/:status/:email", verifyToken,async (req, res) => {
      const status = req.params.status;
      const email = req.params.email;
      const query = {
        status,
        tutorEmail: email,
      };
      const result = await sessionCollection.find(query).toArray();
      res.send(result);
    });
    //get single session by id
    app.get("/session/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.findOne(query);
      res.send(result);
    });
    //re-post rejected sessions
    app.post("/session/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const session = req.body;
      console.log(session);
      const query = { _id: new ObjectId(id) };
      const deleteSession = await sessionCollection.deleteOne(query);

      const result = await sessionCollection.insertOne(session);
      res.send(result);
    });
    //update session
    app.patch("/session/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const session = req.body;
      const update = {
        $set: session,
      };
      const result = await sessionCollection.updateOne(query, update);
      res.send(result);
    });
    //get tutor sessions
    app.get("/sessions/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req?.decoded?.email)
        return res.status(403).send({ message: "unauthorized access" });
      const query = { tutorEmail: email };

      const result = await sessionCollection.find(query).toArray();

      res.send(result);
    });

    //upload materials to db
    app.post("/materials", verifyToken,async (req, res) => {
      const materials = req.body;
      const result = await materialCollection.insertOne(materials);
      res.send(result);
    });
    //get all materials
    app.get('/materials',async(req,res)=>{
      const result = await materialCollection.find().toArray()
      res.send(result);
    })
    //view tutor materials
    app.get("/materials/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { tutorEmail: email };
      const result = await materialCollection.find(query).toArray();
      res.send(result);
    });
    //get single material by ID
    app.get("/material/:id", verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialCollection.findOne(query);
      res.send(result);
    });
    // update material
    app.patch("/material/:id", verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const materials = req.body;
      const updateMaterial = {
        $set: materials,
      };
      const result = await materialCollection.updateOne(query, updateMaterial);
      res.send(result);
    });
    //delete material
    app.delete("/material/:id", verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialCollection.deleteOne(query);
      res.send(result);
    });
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
