const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json())

dotenv.config({path: "./config.env"});
require("./db/conn");

const port = process.env.PORT || 8000;

const staticPath = path.join(__dirname, "./public");
app.set("view engine", "hbs");

// app.use(express.static(staticPath));

app.use(express.json());

// app.use(require("./router/route"));



const User = require("./model/userSchema");


const authenticate = async (req,res,next) => {
    try{
        const token = req.cookies.etark;
        if(token){
            const verifytoken = jwt.verify(token,process.env.SECRET_KEY);
            const rootUser = await User.findOne({__id:verifytoken.__id,token:token});
            if(!rootUser){
                throw new Error("User not loggined");
            }
            req.token = token;
            req.rootUser = rootUser;
            req.userID = rootUser._id;
            return res.render("welcome", {name: rootUser.name,email: rootUser.email, error: "went something wrong" });
        }else{
            throw new Error("User not loggined");
        }
    }catch(err){
        //console.log(err);
        next();
        //return res.status(401).send({error: "unauthorized: no token provided"});
    }
}



app.get("/",authenticate,(req,res) => {
    res.render("home");
});

app.get("/login",authenticate,(req,res) => {
    res.render("login");
});

app.get("/signup",authenticate,(req,res) => {
    res.render("signup");
});




app.post("/login", async (req,res) => {
    const {email,password} = req.body;
    // console.log(email);
    // console.log(password);
    if(!email.trim() || !password.trim()){
        //return res.status(422).json({error: "All fields should be filled properly"});
        return res.render("login", { error: "All fields should be filled properly" });
    }
    try{
        const userExist = await User.findOne({email: email});
        if(userExist){
            const isMatched = await bcrypt.compare(password,userExist.password);
            if(isMatched){
                const token = await userExist.generateAuthToken();
                res.cookie("etark",token,{
                    expire: new Date(Date.now()+25892000000),httpOnly:true
                });
                return res.render("welcome", { name: userExist.name, email: userExist.email, success: "successfully loggined" });
            }else{
                return res.render("login", { error: "Invalid data" });
            }
        }else{
            return res.render("login", { error: "Invalid data" });
        }
    }catch(err){
        console.log(err);
        return res.render("login", { error: "Something went wrong" });
    }
});

app.post("/signup",async (req,res) => {
    const {name,email,password,cpassword} = req.body;
    
    if(!name.trim() || !email.trim() || !password.trim() || !cpassword.trim()){
        return res.render("signup", { error: "All fields should be filled properly" });
    }else if(password!==cpassword){
        return res.render("signup", { error: "Password and confirm password should be match" });
    }else if(password.length<8){
        return res.render("signup", { error: "Minimum length of password is 8" });
    }
    try{
        //console.log("checking");
        const userExist = await User.findOne({email: email});
        if(userExist){
            return res.render("signup", { error: "Already registered" });
        }
        const user = new User({name,email,password});
        await user.save();
        return res.render("login", { success: "user registered successfully" });
    }catch(err){
        return res.render("login", { error: "something went wrong" });
    }
});
app.get("/logout",(req,res) => {
    res.clearCookie("etark",{path: "/"});
    return res.render("home", { success: "logout successfully" });
});





app.listen(port, () => {
    console.log(`server is running at port number ${port}`);
});