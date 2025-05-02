import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {v4 as uuid} from "uuid"
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";

// here saving token in the cookie
const cookieOptions = {
maxAge: 15 * 24 * 60 * 60 * 1000,//Cookie will expire after 15 days (in milliseconds).
    sameSite: "none",// allows the cookie to be sent in cross-site requests. 
    httpOnly: true,  //Cookie can't be accessed by JavaScript in the browser (extra secure).
    secure: true,
  };
const connectDB=(url)=>{
    mongoose.connect(url,{dbName:"talkdb"})
    .then((data)=>console.log(`connected to db:${data.connection.host}`)).
    catch((err)=>{
        throw err;
     })
}

const sendToken = (res, user, code, message) => {
// here the code is respose code
    const token = jwt.sign({ _id: user._id },process.env.JWT_SECRET);
    // console.log(token);

    return res.status(code).cookie("chattu-token", token, cookieOptions).json({
  
    // A key-value pair along with some optional settings hold by cookie
    // Storing passwords or sensitive info in plain text


    success: true,
    user,
      message,
    });
  };
  
// sendToken("sd",{_id:"asd"},201,"User created");

const emitEvent = (req, event, users, data) => {
  
  // const io = req.app.get("io");
  // console.log("jik")
//  req.app.get("io") is often used to access the io instance inside a route handler,
  // const usersSocket = getSockets(users);
  // io.to(usersSocket).emit(event, data);

 console.log(event);
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
  // from here only we send data to chat to display the attachment
};


// here we are uploading the files in cloud
const uploadFilesToCloudinary = async (files = []) => {
  
  const uploadPromises = files.map((file) => {
    // Loop through each file, and for each file create
    //  a Promise that uploads it to Cloudinary.
  

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),//Upload the file after converting it to base64
        {
          resource_type: "auto", // Automatically detect if it's image, video,
          public_id: uuid(),// Assign a unique ID using uuid()
        },
        (error, result) => {
          if (error) return reject(error);
          // Something went wrong! Send this error to whoever is handling this Promise.”   ;//If the upload fails", run reject(error).
          // It throws the error so that it can be caught with .catch() or inside a try...catch.
        
        
          resolve(result);//If the upload succeeds", run resolve(result)
          // Everything worked! Return this result to whoever is waiting for this Promise.”
     
     
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    // This line triggers all the file uploads at the same time, not one after 
    // another — and waits until they’re all done.
    // Wait until all the file uploads are done, then give me their results as an array.”
    
    // here we formating the result
    // [  this is received result
    //   { public_id: "abc123", secure_url: "https://res.cloudinary.com/...1" },
    //   { public_id: "def456", secure_url: "https://res.cloudinary.com/...2" },
    //   { public_id: "ghi789", secure_url: "https://res.cloudinary.com/...3" },
    // ]
    console.log(results)
    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    // throw new Error("Error uploading files to cloudinary", err);
    throw new Error(`Error uploading files to cloudinary: ${err.message}`);

  }
};









const deletFilesFromCloudinary = async (public_ids) => {
  // Delete files from cloudinary
};

export {uploadFilesToCloudinary,deletFilesFromCloudinary,sendToken,connectDB,cookieOptions,emitEvent}