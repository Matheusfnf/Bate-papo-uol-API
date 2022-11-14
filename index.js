import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

const messageSchema = joi.object({
  to: joi.string().required().min(3).max(30),
  text: joi.string().required(),
  type: joi.valid("message", "private_message").required(),
  from: joi.string(),
  time: joi.string(),
});

const statusSchema = joi.object({
  to: joi.string().required().min(3).max(30),
  text: joi.string().required(),
  type: joi.valid("message", "private_message").required(),
  from: joi.string(),
  time: joi.string(),
});

const participantSchema = joi.object({
  name: joi.string().required().min(3).max(30),
  lastStatus: joi.date(),
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

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();

    res.send(participants);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const sendObj = { name, lastStatus: Date.now() };
  const now = dayjs().format("HH:mm:ss");
  const logInMessage = {
    to: "Todos",
    text: "Entrou na sala...",
    type: "status",
    from: name,
    time: now,
  };

  const validation = participantSchema.validate(sendObj, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.send(errors);
    return;
  }

  try {
    await db.collection("participants").insert(sendObj);
    await db.collection("message").insert(logInMessage);
    res.status(201).send("Participante entrou com sucesso!");
  } catch (err) {
    res.status(422).send(err);
  }
});

app.get("/messages", async (req, res) => {
  const  limit  = Number(req.query.limit);
  const { user } = req.headers;

  try {
    const message = await db
      .collection("message")
      .find({
        $or: [
          { from: user },
          { to: { $in: [user, "Todos"] } },
          { type: "message" },
        ],
      })
      .limit(limit)
      .toArray();

    // if (limit) {
    //   const ultimasmsgs = message.slice(message.length - limit);
    //   res.send(ultimasmsgs);
    //   return;
    // }

    if(messageSchema.length === 0 ){
      return res.status(404).send("Não foi encontrada nenhuma mensagem!")
    }
    res.send(message);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const now = dayjs().format("HH:mm:ss");
  const sendObj = { to, text, type, from: user, time: now };

  const validation = messageSchema.validate(sendObj, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.send(errors);
    return;
  }

  try {
    await db.collection("message").insert(sendObj);
    return res.status(201).send("Mensagem enviada com sucesso!");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

app.post("/status", async (req, res) => {
  const { user } = req.headers;

  if (!user) return res.status(404);

  try {
    const user1 = await db.collection("participants").findOne({ name: user });
    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
    res.status(201).send("status atualizado!");
  } catch (err) {
    console.log(err);
    res.status(422).send(err);
  }
});

let users;
let counting = 0;

setInterval(async () => {
  try {
    counting++;
    console.log("to acontecendo rapaz");
    const oldUsers = await db.collection("participants").find().toArray();
    if (counting % 2 === 0) {
      console.log("users sem nada ainda!");
      return (users = oldUsers);
    }
    const now = dayjs().format("HH:mm:ss");

    for (let i in oldUsers) {
      const logInMessage = {
        to: "Todos",
        text: "Saiu da sala...",
        type: "status",
        from: oldUsers[i].name,
        time: now,
      };

      if (oldUsers[i].lastStatus == users[i].lastStatus) {
        await db.collection("message").insert(logInMessage);
        await db
          .collection("participants")
          .deleteOne({ name: oldUsers[i].name });
      }
    }
  } catch (e) {
    console.log(e);
  }
}, 7500);

app.listen(5000, () => console.log("server running on port 5000"));

/*

  {
    "from": "matheus",
    "to": "julia",
    "text": "oiiii",
   "time": "20:42:12"
  }
*/
