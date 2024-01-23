const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser")
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const bookingCollection = client.db("homeHunter").collection("booking")
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

        let user=await userCollection.findOne({email});

        if(!user){
            return res.status(401).json({message: 'Invalid email or password'}) 
        }

        const isPasswordValid = await bcrypt.compare(password,user.password)

        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid email or password'}) 
        }

        const token = jwt.sign({email:user.email,role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn :'1h'});
        let a = {
          ...user,
          token:token
        }
        
          res.send(a)
      })

      app.post("/addHome", async (req, res) => {

        const newHome = {...req.body};
        const result = await huntingCollection.insertOne(newHome);
        res.send(result);
      });

      app.get("/allHomes", async (req, res) => {
        const result = await huntingCollection.find().toArray();
        res.send(result);
      });
      app.get("/allHomes", async (req, res) => {
        const email=email;
        const result = await huntingCollection.find({email}).toArray();
        res.send(result);
      });

      app.get("/homedetails/:_id", async (req, res) => {
        const homeId = req.params._id;
        const query = { _id: new ObjectId(homeId) };
        const home = await huntingCollection.findOne(query);
  
        res.send(home);
      });

      app.put("/updateHome/:_id", async (req, res) => {
        const id = req.params._id;
        
        const home = req.body;
        
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
  
        const updateHome = {
          $set: home,
        };
  
        const result = await huntingCollection.updateOne(filter, updateHome, options);
  
        if (result.modifiedCount > 0) {
          
          res.send(result);
        }
      });

      app.delete("/deleteHome/:_id", async (req, res) => {
        const id = req.params._id;
        const query = { _id: new ObjectId(id) };
        const result = await huntingCollection.deleteOne(query);
        
        res.send(result);
      });


      app.post('/booking', async(req,res) =>{
        const {houseId,name,email,phone} = req.body
        console.log(houseId,name,email,phone)
      
        const renterBookings = bookingCollection.find({email:email}).toArray()

        if(renterBookings.length >= 2){
          return res.status(400).json({message: 'You can book a maximum of two houses.'}) 
        }
        const selectedHouse = await huntingCollection.findOne({_id : new ObjectId(houseId)})
        if(!selectedHouse){
          return res.status(404).json({message: 'House not found.'}) 
        }

        const booking ={
        houseId : new ObjectId(houseId),
        name,
        email,
        phone
        }
        const result = await bookingCollection.insertOne(booking)
        
        res.json(result)
      })

    
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