import app from "./app.js";
import connectDB from "./config/database.js";


connectDB();

app.listen(3000,()=>{
    console.log("Server Running On Port 3000");
})