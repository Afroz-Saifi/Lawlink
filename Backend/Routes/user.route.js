const express=require('express');
const { UserModel } = require('../Models/user.model');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer');
const otpGenerator = require('otp-generator')
const userRoute=express.Router();
const otpverify=require("../Middleware/otp.middleware");
const { UserOTP } = require('../Models/otp.model');

userRoute.post("/register",async(req,res)=>{
    const {Phone_No,email,password,Name , city }=req.body;
    const user=await UserModel.find({email});
    //console.log(Phone_No)
    try {
        
        //console.log(user)
        if(user.length===0){
            bcrypt.hash(password,5,async(err,hash)=>{
                if(err){
                    throw err
                }
                let userp=await new UserModel({Name,email,password:hash,Phone_No,city , role:"user" , verify:false});
                 userp.save();
            });
            let OTP= otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: true }); //otp generation;
                let otp=new UserOTP({Useremail:email,otp:OTP,createdAt:new Date(),expireAt:new Date()+86400000});
                otp.save();                                                                          // saving the otp in backend
                let tokenOTP=jwt.sign({'Useremail':email},'masai');                    // token genration to pass unique email for verification through otp
                sendOTPforverification(email,OTP);                                                  //  sending email
                res.status(200).send({msg:"Please verify your email !","token":tokenOTP});         // response 
        }
        else{
            res.status(400).send({msg:"user already exist please Login!"})
        }
    } catch (error) {
        res.status(400).send({msg:"error can't register the user"})
    }
    
})

userRoute.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    try {
        let user=await UserModel.find({email})
        if(user.length>0){
            if(user[0].verify){
                bcrypt.compare(password,user[0].password,async(err,result)=>{
                    if(err)
                    throw err;
                    if(result){
                        res.status(200).send({msg:"sucessfully Login!","token":jwt.sign({'userID':user[0]._id},'masai'),"Name":user[0].Name})
                    }else{
                        res.status(400).send({msg:"Wrong credentials"})
                    }
                })
            }else{
                res.status(400).send({msg:"Verify your email first !"});
            }
            
        }else{
            res.status(400).send({msg:"Registered First!"})
        }
    } catch (error) {
        res.status(400).send({"msg":error.message});
    }
})


userRoute.post("/verifyotp",otpverify, async(req,res)=>{
    const {Useremail,otp}=req.body;
    const user=await UserModel.find({email:Useremail});
    const databaseotp=await UserOTP.find({Useremail});
     try {
       if(otp===databaseotp[0].otp){
        await UserModel.findByIdAndUpdate(user[0]._id, { verify: true });
        await UserOTP.deleteMany({Useremail});
        res.status(200).json({msg:"Email verified"});
       }else{
        res.status(200).json({msg:"Wrong otp !"});
       }
     } catch (error) {
        res.status(500).send({msg:"Network error !"});
     }   
})

userRoute.post("/forgot-password",async(req,res)=>{
    let {email}=req.body;
    let user=await UserModel.find(email);

    if(user.length===0){
        res.status(200).send({msg:"user not exist !"})
    }else{
        let token=jwt.sign({'userID':user[0]._id},'masai');
       let link=`https://127.0.0.1:8080/${user[0]._id}/${token}`
       sendemailrestlink(email,link)
    }
})



const transporter = nodemailer.createTransport({
    service:'gmail',
    host: 'smtp.gmail.email',
    port: 587,
    secure:false,
    auth: {
        user: 'lawlink.legal.services@gmail.com',
        pass: 'qzroppedvawxedzh'
    }
});


function sendOTPforverification(email,otp){
    transporter
    .sendMail({
       from:"lawlink.legal.services@gmail.com",
       to:email,
       subject:"Verify your Email for registraion on LawLink",
       text:"hey it's",
       html:`<h1>OTP for email verification:${otp}</h1>`
    })
    .then(()=>{
       console.log("mail sent succesfully")
    })
    .catch((err)=>{
       console.log(err)
    })
}


function sendemailrestlink(email,link){
    transporter
    .sendMail({
       from:"lawlink.legal.services@gmail.com",
       to:email,
       subject:"link to reset your password",
       //text:"hey it's",
       html:`<p>Link for resetting your password<a href=${link}>link</a></p>`
    })
    .then(()=>{
       console.log("mail sent succesfully")
    })
    .catch((err)=>{
       console.log(err)
    })
}





module.exports={userRoute}