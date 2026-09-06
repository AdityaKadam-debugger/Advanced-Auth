import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [ true, "Username is Required"],
        unique: [ true, "Username Must Be Unique" ]
    },
    email: {
        type: String,
        required: [ true, "email is Required"],
        unique: [ true, "email Must Be Unique" ]
    },
    password : {
        type: String,
        required: [ true, "Password id required" ]

    },
    verfied:{
        type: Boolean,
        default: false
    }
})

const userModel = mongoose.model("users", userSchema)
export default userModel;
