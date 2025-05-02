// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// import { avatarClasses } from "@mui/material";
import mongoose ,{ Schema , model} from "mongoose";
import { hash } from "bcrypt";


const schema=new Schema({

name:{
    type:String,
    requried:true
},
bio:{
    type:String,
    requried:true
},
username:{
    type:String,
    requried:true,
    unique:true,

},

password:{
    type:String,
    requried:true,
    select:false//it can't fetched by the code
},
avatar:{
    public_id:{
        type:String,
        requried:true

    },
    url:{
        type:String,
        requried:true
    }
},


},


{



    timestamps:true
}



);


schema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        // if password is modified that time you should 
        // execute the hash function otherwise move to the 
        // other middelware
        
        return next();
    
    }
    // bcrypt generates a unique salt using 10 rounds 
    // 10: This is the salt rounds, which determines how secure (and computationally expensive) the hash will be. 
    // More rounds = more secure but slower.   
    //Then it hashes your password + that salt together.

    // The final hash returned includes the salt embedded in it.
    this.password = await hash(this.password, 10);
  });
  // if svaing the data in the db we need to hash that password then we need to save


export const User =mongoose.models.User||model("User",schema)
