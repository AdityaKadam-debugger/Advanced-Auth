import express from "express";
const app = express();

import morgan from 'morgan';
import authRouter from './routes/authroutes.js';
import cookieParser from "cookie-parser";

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", authRouter)


export default app;


