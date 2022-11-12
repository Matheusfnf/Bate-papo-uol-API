import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

try {
  await mongoClient.connect();
  db = mongoClient.db("bate-papo-uol");
} catch (err) {
  console.log(err);
}

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

  try {
    await db.collection("message").insert(body);
    res.status(201).send("Mensagem enviada com sucesso!");
  } catch (err) {
    res.status(500).send(err);
  }
});

// db.collection("message")
//   .insert({
//     to,
//     text,
//     type,
//   })
//   .then((response) => {
//     console.log(response);
//     res.status(201).send("mensagem enviada com sucesso!");
//   })
//   .catch((err) => {
//     res.status(500).send(err);
//   });

app.listen(5000, () => console.log("server running on port 5000"));
