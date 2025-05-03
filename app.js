// console.log("hi from vao")\\



import express from "express";
import { connectDB } from "./utils/features.js";
import dotenv from 'dotenv';
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { isAuthenticated, socketAuthenticator } from "./middlewares/auth.js";
import userRoute from './routes/user.js';
import chatRoute from './routes/chat.js';
import adminRoute from './routes/admin.js';
import http from 'http';
import { Server } from 'socket.io';
import { createUser } from "./seeders/user.js";
import { createGroupChats, createMessagesInAChat, createSingleChats } from "./seeders/chat.js";
import { Socket } from "dgram";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import   cors from "cors"
import { v2 as cloudinary } from "cloudinary";

import {v4 as uuid} from 'uuid';
import { getSockets } from "./lib/helper.js";
import { corsOptions } from "./constants/config.js";
import { Message } from "./models/message.js";
// The cookie-parser middleware in Express is used to parse cookies attached to the client request object (req). That way, you can easily read
//  and access cookies sent by the browser.

dotenv.config({
    path:"./.env"
})
cloudinary.config({
  // When you use Cloudinary in your Node.js backend (or any server-side code), it needs to know which Cloudinary account to 
  // interact with. That’s what these values provide:
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const onlineUsers = new Set(); //set is used to hold the unique values

const app=express();
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "nvp";
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
app.use(cors(
//   {

// origin:["http://localhost:5173","http://localhost:4173",
//         // process.env.CLIENT_URL
//        "https://chatapp-frontend-92xg.vercel.app"
// ]
// ,
// credentials:true

// }

corsOptions
));

const userSocketIDs = new Map();//here all the active user will be there



// NODE_ENV=DEVELOPMENT is set only for that command, and process.env.NODE_ENV in your app will be "DEVELOPMENT".
// You are setting the environment variable NODE_ENV. IN SCRIPT CODE OF PACKAGE.JSON , IF WE DID LIKE THIS WE NOT NEEDED ENV FILE


const server = http.createServer(app); // ✅ Create HTTP server from express app

const io = new Server(server,
  {
   cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      // process.env.CLIENT_URL,
      "https://chatapp-frontend-92xg.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
       
       // corsOptions
  }
); // ✅ Attach socket.io to the HTTP server

app.set("io", io);
//  This line stores the io instance (which is the Socket.io server instance) into the app object so that you can access it later in other parts of your application.
// access it using app.get("io") from other parts of your application.


//here first we need to connect with db
connectDB(process.env.MONGO_URI);
// createUser(10)
// createSingleChats(10);
// createGroupChats(10);
// createMessagesInAChat("67fa5634f273da7482817ac1",50);
// const PORT= https://chatapp-kchw.onrender.com||3000
const PORT =process.env.PORT||3000


app.use(express.json());
app.use(cookieParser()); // must be before your routes

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON requests


app.use('/api/v1/user',userRoute);
app.use('/api/v1/chat',chatRoute);
app.use('/api/v1/admin',adminRoute);



app.get("/",(req,res)=>{
    res.send("hello world");
})

// here it act as the middlewre if it fails i will not go forward
// or not allow to establish the connection 
io.use((socket, next) => {
    cookieParser()(
      socket.request,
      socket.request.res,
      // next
      async (err) => await socketAuthenticator(err, socket, next)//AS IT S ASYCN FUNCTION
    );
  });


io.on("connection",(socket)=>{
   console.log("a user  connected",socket.id);
   const user=socket.user//here current user will be stored here
//  it is emit from frontend and listen from the backend


    // here we are mapping the userid with it's own socket id
    userSocketIDs.set(user._id.toString(), socket.id);
    // console.log(userSocketIDs);


   socket.on(NEW_MESSAGE, async ({ chatId, members, message }) =>{

        // const user={
        //     _id:"67eea274305b09c23ab593a9",
        //     name:"haro"
        
        // }
        
        // const user = socket.user;
    

        const messageForRealTime = {
                        // this message is created to send to all the members of that particular cha

            content:message,
            _id: uuid(),//it is the temporary id 
            sender: {
              _id: user._id,
              name: user.name,
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
          };
    
    
    
     const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId,
      };
    
    
    const membersSocket = getSockets(members);
    // holding the socket id of all the members of this particular chat sending the
    // message to onlythose members

    console.log("emiting ",membersSocket)


    // it is emited from here and it will be listened from frontend
    io.to(membersSocket).emit(NEW_MESSAGE, {
        // here all  the membersSocket will triggred one by one
        // here sending the message to all the members
        chatId,
        message: messageForRealTime,
      });
// it will be also listened from frontend
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
// it just alert for the user of new arrive of message

// overall execution of this event 
// first user send  a messages  it will be listened by this event
// then meassage will be created for sending to other members
// then messages is created to store in the db
// then collecting all the socketid of the members then sending
// created messages
// then emit NEW_MESSAGE_ALERT event to all the mebers of the group  to notify about the new messages

    //   console.log(messageForRealTime);




    try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }

    });



// it will handle that  START_TYPING emit event
// from  frontend  emit is taking place it will sent to backend
// then from the backend emit will be taking place  to  membersSockets
    socket.on(START_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(START_TYPING, { chatId });
    });
  
    socket.on(STOP_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    });

   
  
    socket.on(CHAT_JOINED, ({ userId, members }) => {
      onlineUsers.add(userId.toString());//add that user in set 
  console.log("this person joined",userId)
      const membersSocket = getSockets(members);//getting socket id of other  members connected with this user and chat 
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));//SET COVERTED INTO ARRAY AND SEND
    });
  
    socket.on(CHAT_LEAVED, ({ userId, members }) => {
      onlineUsers.delete(userId.toString());//when they leave the group  remove from the set
      console.log("this person leaved",userId)

      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  

    


    socket.on("disconnect",()=>{
        console.log("user disconnected");
        // when all the active users are disconnecting then we need to remove
        //  all the user'socket id from the userSocketIDs map

        userSocketIDs.delete(
          user._id.toString()
        // socket.id.toString()
      );
      onlineUsers.delete(user._id.toString());//for safer side
// removing them from the online user


socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
// it is basically indicating/updating  about the staus of the online user to all those member  in socket
// leave those who left

    })
})













// Register/put the error middleware AFTER all routes

app.use(errorMiddleware);
// And if nothing ran before the error middleware, it has nothing to "catch".
// it catch some error then errorMiddleware will be triggred
server.listen(PORT,()=>{
    console.log(`server is running on port ${PORT} in ${process.env.NODE_ENV.trim()}`)
});




export {adminSecretKey,envMode,userSocketIDs};














