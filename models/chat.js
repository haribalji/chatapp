// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// import { avatarClasses } from "@mui/material";
import mongoose ,{ Schema , model,Types} from "mongoose";


const schema=new Schema({

name:{
    type:String,
    requried:true
},
groupChat:{
    type:Boolean,
    default:false,

},

creator:{
    type:Types.ObjectId,//getting the reference from user collection
    ref:"User"
},
members:[
    {
        type:Types.ObjectId,
        ref:"User",
    }
],

},

{
 timestamps:true
}

);



export const Chat =mongoose.models.Chat||model("Chat",schema)
