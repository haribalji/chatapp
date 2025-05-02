// const mongoose = require('mongoose');
// const { Schema } = mongoose;

import { avatarClasses } from "@mui/material";
import mongoose ,{ Schema , model,Types} from "mongoose";


const schema=new Schema(
{

content:String,

attachments:[
    {
    public_id:{
        type:String,
        requried:true

    },
    url:{//as we need the data from the 
        type:String,
        requried:true
    }
}
],

sender:{//it will pointing the user
    type:Types.ObjectId,//getting the reference from user collection
    ref:"User",
    required:true,

},
chat:{//it will be pointing to the corresponding chat
    type:Types.ObjectId,//getting the reference from chat collection
    ref:"Chat",
    required:true,
},

},


{



    timestamps:true
}



);



export const Message =mongoose.models.Message||model("Message",schema)