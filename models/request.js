import { avatarClasses } from "@mui/material";
import mongoose ,{ Schema , model,Types} from "mongoose";
const schema=new Schema({

    status:{
        type:String,
        default:"pending",
        enum:["pending","accepted","rejected"]
        // enum is used to define a set 
        // of allowed values for the status field  if other values inserted then it will raise error
   
    },
    
    
    sender:{//it will pointing the user
        type:Types.ObjectId,//getting the reference from user collection
        ref:"User",
        required:true,
    
    },
    receiver:{
        type:Types.ObjectId,//getting the reference from user collection
        ref:"User",
        required:true,
    },
    },
{



    timestamps:true
}



);



export const Request =mongoose.models.Request||model("Request",schema)