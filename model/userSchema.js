const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
        default: ""
    }
});

userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password,12);
    }
    next();
});

userSchema.methods.generateAuthToken = async function(){
    try{
        let usertoken = jwt.sign({__id:this.__id},process.env.SECRET_KEY);
        this.token = usertoken;
        await this.save();
        return usertoken;
    }catch(err){
        console.log("generateAuthToken Error: ",err);
    }
}

const User = mongoose.model("USER",userSchema);

module.exports = User;