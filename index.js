const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_USER}@cluster0.df9nipl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

// jwt

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

// mongodb code is here

async function run() {
  try {
    const serviceCollection = client.db("photography").collection("services");
    const addReviewCollection = client.db("user").collection("reviews");

    // jwt post
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "12h"
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const curser = serviceCollection.find(query);
      const services = await curser.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //  service post

    app.post("/services", verifyJWT, async (req, res) => {
      const order = req.body;
      const result = await serviceCollection.insertOne(order);
      console.log(result);
      res.send(result);
    });

    // review post

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await addReviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews/:serviceId", async (req, res) => {
      const serviceId = req.params.serviceId;
      const query = { serviceId };
      const sort = { time: -1 };
      const curser = addReviewCollection.find(query).sort(sort);
      const result = await curser.toArray();
      console.log(serviceId);
      res.send(result);
    });

    app.get("/myreview/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const sort = { time: -1 };
      const curser = addReviewCollection.find(query).sort(sort);
      const result = await curser.toArray();
      res.send(result);

      // review delete

      app.delete("/myreview/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await addReviewCollection.deleteOne(query);
        res.send(result);
      });
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Photography server is running");
});

app.listen(port, () => {
  console.log(`Photography server on ${port}`);
});

// steps
