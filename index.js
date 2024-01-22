const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldrxrdq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();

    const huntingCollection = client.db("homeHunter").collection("home");

    app.post("/register", async (req, res) => {
        const user = req.body;
  
        const result = await huntingCollection.insertOne(user);
        
        res.send(result)
      });

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("Home is searching");
  });
  
  app.listen(port, () => {
    console.log(`Home server is searching on port: ${port}`);
  });