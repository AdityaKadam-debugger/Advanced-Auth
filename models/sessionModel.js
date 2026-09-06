import mongoose from "mongoose";
import { refreshToken } from "../controllers/auth_controller.js";

const sessionSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is Required" ]
    },
    refreshTokenHash: {
        type: String,
        required: [ true, "Refresh Token Hash is Required" ]

    },
    ip:{
        type: String,
        required: [ true, "IP address is required" ]
    },
    userAgent:{
        type: String,
        required: [ true, "User Agent is required" ]
    },
    revoked: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
})

const sessionModel = mongoose.model("sessions", sessionSchema)

export default sessionModel