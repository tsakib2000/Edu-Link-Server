require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

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
    const bookedSessionCollection = db.collection("bookedSession");
    const reviewCollection = db.collection("reviews");
    const noteCollection = db.collection("notes");
    //Verify JWT token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "forbidden access" });
        }

        req.decoded = decoded;
        next();
      });
    };
    //verify user admin
    const verifyAdmin=async(req,res,next)=>{
      const email = req.decoded.email;
      const query ={email}
      const user = await usersCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if(!isAdmin){
        return res.status(403).send({message:'Forbidden Access'})
      }
      next();
    }
    //verify Tutor
    const verifyTutor=async(req,res,next)=>{
      const email = req.decoded.email;
      const query ={email}
      const user = await usersCollection.findOne(query)
      const isTutor = user?.role === 'tutor'
      if(!isTutor){
        return res.status(403).send({message:'Forbidden Access'})
      }
      next();
    }
    // jwt api
    //verify Tutor
    const verifyStudent=async(req,res,next)=>{
      const email = req.decoded.email;
      const query ={email}
      const user = await usersCollection.findOne(query)
      const isStudent = user?.role === 'student'
      if(!isStudent){
        return res.status(403).send({message:'Forbidden Access'})
      }
      next();
    }
    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });



    //get all tutor
    app.get("/users/:role", async (req, res) => {
      const role = req.params.role;
      const query = { role };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    //Users related api

    //post api
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
    app.patch("/user/:id",verifyToken,verifyAdmin, async (req, res) => {
      const role = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateRole = {
        $set: role,
      };
      const result = await userCollection.updateOne(query, updateRole);
      res.send(result);
    });
    //Get All users
    app.get("/users", verifyToken, async (req, res) => {
      const search = req.query.search;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      
      let query = {};
      query = {
        email: {
          $regex: String(search),
          $options: "i",
        },
      };

      const result = await userCollection.find(query).skip(page*size).limit(size).toArray();
      res.send(result);
    });
    // get single user
    app.get("/users/role/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    //get user count 
    app.get('/user-count',verifyToken,async(req,res)=>{
      const count = await userCollection.estimatedDocumentCount();
      res.send({count})
    })

    //save tutor study session
    app.post("/sessions", verifyToken, verifyTutor,async (req, res) => {
      const session = req.body;
      const result = await sessionCollection.insertOne(session);
      res.send(result);
    });

    //get limited & approved study session
    app.get("/approvedSessions/:status", async (req, res) => {
      const status = req.params.status;
      const query = { status };
      const result = await sessionCollection
        .find(query)
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //get approved study session
    app.get("/AllApprovedSessions/:status", async (req, res) => {
      const status = req.params.status;
      const sort = req.query.sort;
      
      let sortOrder = {};
      const query = { status };
      if (sort) {
        options = { sort: { fee: sort === "asc" ? 1 : -1 } };
      }
      const result = await sessionCollection
        .find(query)
        .sort(sortOrder)
        .toArray();
      res.send(result);
  
    });
    //get all sessions
    app.get("/sessions", verifyToken, async (req, res) => {
      const result = await sessionCollection.find().toArray();
      res.send(result);
    });
    //get approved sessions
    app.get("/session/:status/:email", verifyToken, async (req, res) => {
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
    app.post("/session/:id", verifyToken, verifyTutor,async (req, res) => {
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
    //delete Session
    app.delete("/session/:id", verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.deleteOne(query);
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
    app.post("/materials", verifyToken, async (req, res) => {
      const materials = req.body;
      const result = await materialCollection.insertOne(materials);
      res.send(result);
    });
    //get all materials
    app.get("/materials", verifyToken,async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await materialCollection.find().skip(page*size).limit(size).toArray();
      res.send(result);
    });
    //view tutor materials
    app.get("/materials/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { tutorEmail: email };
      const result = await materialCollection.find(query).toArray();
      res.send(result);
    });
    //get single material by ID
    app.get("/material/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialCollection.findOne(query);
      res.send(result);
    });
    // update material
    app.patch("/material/:id", verifyToken, async (req, res) => {
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
    app.delete("/material/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialCollection.deleteOne(query);
      res.send(result);
    });
    //get materials by session Id
    app.get("/booked-materials/:email",verifyToken, async (req, res) => {
      const studentEmail = req.params.email;

      const bookedSessions = await reviewCollection
        .find({ studentEmail })
        .project({ sessionId: 1, _id: 0 })
        .toArray();
      const sessionIds = bookedSessions.map((session) => session.sessionId);
      const query = { sessionId: { $in: sessionIds } };
      const result = await materialCollection.find(query).toArray();
      res.send(result);
    });
    //get material count
    app.get('/material-count',verifyToken,async(req,res)=>{
      const count= await materialCollection.estimatedDocumentCount();
      res.send({count})
    })
    // post booked study session
    app.post("/bookSession", verifyToken, async (req, res) => {
      const sessionInfo = req.body;
      const result = await bookedSessionCollection.insertOne(sessionInfo);
      res.send(result);
    });
    //get all booked session by email
    app.get("/bookedSession/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { studentEmail: email };
      const result = await bookedSessionCollection.find(query).toArray();
      res.send(result);
    });
    //get booked session by id
    app.get("/bookedSession/details/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedSessionCollection.findOne(query);
      res.send(result);
    });
    //payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { fee } = req.body;
      if (!fee || isNaN(fee)) {
        return res.status(400).send({ error: "Invalid fee provided" });
      }
      const amount = parseInt(fee * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //post student review
    app.post("/reviews", verifyToken, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //get all review by id
    app.get("/reviews/:id", verifyToken, async (req, res) => {
      const sessionId = req.params.id;
      const query = { sessionId };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });
    //post student note
    app.post("/note", verifyToken, verifyStudent,async (req, res) => {
      const note = req.body;
      const result = await noteCollection.insertOne(note);
      res.send(result);
    });
    //get note by id
    app.get("/singleNote/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.findOne(query);
      res.send(result);
    });
    //get note by email
    app.get("/note/personal/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { studentEmail: email };
      const result = await noteCollection.find(query).toArray();
      res.send(result);
    });
    //update note
    app.patch("/note/:id", verifyToken, verifyStudent,async (req, res) => {
      const id = req.params.id;
      const note = req.body;
      const query = { _id: new ObjectId(id) };
      const updateNote = {
        $set: note,
      };
      const result = await noteCollection.updateOne(query, updateNote);
      res.send(result);
    });

    //delete note
    app.delete("/note/:id", verifyToken,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/dashboardStats',async(req,res)=>{
      const bookedSessions = await bookedSessionCollection.countDocuments();
      const users = await userCollection.countDocuments();
      const sessions = await sessionCollection.countDocuments();
      const materials = await materialCollection.countDocuments();
      const reviews = await  reviewCollection.countDocuments();
      res.send({ bookedSessions, users, sessions, materials, reviews })
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
