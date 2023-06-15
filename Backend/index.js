const express=require('express');
const cors=require("cors")
const app=express();
app.use(express.json());
app.use(cors())
const http=require('http');
const  connection  = require('./db');
const { userRoute } = require('./Routes/user.route');

require("dotenv").config();
const server=http.createServer(app);

// ========================================Routes

app.use("/user",userRoute)













// ===========================================listening the server
server.listen(process.env.PORT,async()=>{
    try {
        await connection
        console.log("connected to db")
    } catch (error) {
        console.log(error.message)
    }
    console.log("connected to server")
})