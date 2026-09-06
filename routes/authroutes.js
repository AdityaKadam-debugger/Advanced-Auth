// authroutes waley file mein hum saarey api's ko declare kartey hai 

import { Router } from "express";
import * as authcontroller from "../controllers/auth_controller.js"

const authRouter = Router();


// POST /api/auth/register this will api when somebody hits the post request 

authRouter.post("/register",authcontroller.register);

authRouter.get("/get-me", authcontroller.getMe);

authRouter.get("/RefreshToken",authcontroller.refreshToken);

authRouter.post("/login",authcontroller.login)

authRouter.get("/logout", authcontroller.logout);

authRouter.get("/logout-all",authcontroller.logoutall);

authRouter.get("/verfify-email", authcontroller.verifyEmail);
export default authRouter;