import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs";

const messageSchema = joi.object({
  to: joi.string().required().min(3).max(30),
  text: joi.string().required(),
  type: joi.string().required(),
});



const participantSchema = joi.object({
  name: joi.string().required().min(3).max(30),
  
});


const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
  await mongoClient.connect();
  db = mongoClient.db("bate-papo-uol");
} catch (err) {
  console.log(err);
}

app.get("/participants", async (req,res) => {
  try{
    const participants = await db.collection("participants").find().toArray();
    res.send(participants)
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/participants", async (req,res) => {
  const body = req.body;

  const validation = participantSchema.validate(body, {abortEarly: false});

   if (validation.error) {
     const errors = validation.error.details.map((detail) => detail.message);
     res.send(errors);
     return;
   }

  try {
 await db.collection("participants").insert(body)
 res.status(201).send("Participante entrou com sucesso!")
  }
  catch(err){
    res.status(422).send(err)
  }
})

app.get("/message", async (req, res) => {
  try {
    const message = await db.collection("message").find().toArray();
    res.send(message);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/message", async (req, res) => {
  const body = req.body;
  const {User} = req.headers;

  const validation = messageSchema.validate(body, {abortEarly: false});
 
  if(validation.error){
    const errors = validation.error.details.map(detail => detail.message)
    res.send(errors)
    return
  }

  try {
    await db.collection("message").insert(body);
    res.status(201).send("Mensagem enviada com sucesso!");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(5000, () => console.log("server running on port 5000"));


  /*
  {
    "from": "matheus",
    "to": "julia",
    "text": "oiiii",
   "time": "20:42:12"
  }
*/

