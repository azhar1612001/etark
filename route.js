
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("./db/conn");

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



router.get("/",authenticate,(req,res) => {
    res.render("home");
});

router.get("/login",authenticate,(req,res) => {
    res.render("login");
});

router.get("/signup",authenticate,(req,res) => {
    res.render("signup");
});




router.post("/login", async (req,res) => {
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

router.post("/signup",async (req,res) => {
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
router.get("/logout",(req,res) => {
    res.clearCookie("etark",{path: "/"});
    return res.render("home", { success: "logout successfully" });
});



module.exports = router;