const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser")
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require("bcrypt")
const jwt=require('jsonwebtoken')
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());
app.use(bodyParser.json())


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

    const userCollection = client.db("homeHunter").collection("users");
    const huntingCollection = client.db("homeHunter").collection("home");

    app.post("/register", async (req, res) => {
        const { fullname, role, phone, email, password } = req.body;

        const existingUser = await userCollection.findOne({email})

        if(existingUser){
            return res.status(400).json({message: 'Users already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser ={
            fullname, role, phone, email, password:hashedPassword
        }
  
        await userCollection.insertOne(newUser);

        const token = jwt.sign({email:newUser.email,role:newUser.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn :'1h'});

        res.json({token})
        
      });

      app.post('/login', async(req, res) =>{
        const {email, password} = req.body;

        const user=await userCollection.findOne({email});

        if(!user){
            return res.status(401).json({message: 'Invalid email or password'}) 
        }

        const isPasswordValid = await bcrypt.compare(password,user.password)

        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid email or password'}) 
        }

        const token = jwt.sign({email:user.email,role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn :'1h'});
          res.json({token})
      })

      app.post("/addHome", async (req, res) => {
        const newHome = req.body;
        const result = await huntingCollection.insertOne(newHome);
        res.send(result);
      });

      app.get("/allHomes", async (req, res) => {
        const result = await huntingCollection.find().toArray();
        res.send(result);
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