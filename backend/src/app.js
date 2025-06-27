import express from "express";
import {createServer} from "node:http";

import {connectToSocket} from "./controllers/socketManager.js ";

import mongoose from "mongoose";

import cors from "cors";
import usersRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port",(process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

app.use("/api/v1/users", usersRoutes);

const start = async() => {
  app.set("mongo_user")
  const connectionDb = await mongoose.connect("mongodb+srv://thakorprachi08:Mahadev%4088@cluster0.olf0xxj.mongodb.net/");
    
  console.log(`Connected to MongoDB: ${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
        console.log("Server is running on port 8000");
    });
}
start();