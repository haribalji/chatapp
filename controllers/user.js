
import { compare } from 'bcrypt';
import {User} from '../models/user.js'
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from '../utils/features.js';
import { TryCatch } from '../middlewares/error.js';
import { ErrorHandler } from '../utils/utility.js';
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/events.js';

import { getOtherMember } from "../lib/helper.js";

// //here a create the new user and save it in the database and save it cookie
// const newUser= async(req,res)=>{

// const {name ,username,password,bio}=req.body;//here we are getting the data from the body

// const avatar={
//     public_id:"sdf",
//     url:"sdvsd",
// }
// console.log("hi");
// console.log(req.body.name);
// //    here we are creating the instance in the user in db
//    await User.create({name,bio,username,password,avatar});
//     res.status(201).json({message:"user message is created sucessfully"});
// }



// export  {login,newUser};


// new user registred

// const newUser =async (req, res) => {
//     try {
//       const { name, username, password, bio } = req.body;
//       const file = req.file;

//       if (!file) return next(new ErrorHandler("Please Upload Avatar"));
    
//       if (!name || !username || !password) {
//           console.log(req.bod);

//         return res.status(400).json({ error: "Missing required fields" });
//       }
  
//       const avatar = {
//         public_id: "sdf",
//         url: "sdvsd",
//       };
  
//       console.log("Creating user:", req.body);
  
// const user=await User.create({ name, username, password, bio, avatar });
//     //   res.status(201).json({ message: "User created successfully" });
    
    
//     sendToken(res,user,201,"User created")
    
//     } catch (error) {
//       if (error.code === 11000) {
//         return res.status(409).json({ error: "Username already exists" });
//       }
//       console.error(error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   };



const newUser = TryCatch(async (req, res, next) => {
  const { name, username, password, bio } = req.body;

  const file = req.file;

  if (!file) return next(new ErrorHandler("Please Upload Avatar"));

  const result = await uploadFilesToCloudinary([file]);//file passed in array

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const user = await User.create({
    name,
    bio,
    username,
    password,
    avatar,
  });

  sendToken(res, user, 201, "User created");
});
  

  // login user
  
  const login =TryCatch (async (req, res, next) => {

   
    const { username, password } = req.body;
  
    const user = await User.findOne({ username }).select("+password");
    // here getting the user from the db
  
    // if (!user) return res.status(400).json({
    //     message:"invalid username"
    // })
    if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));

//     const isMatch = await compare(password, user.password);
// //   here comparing the password received and user hashed password
//     // if (!isMatch)
//     //   // return res.status(400).json({message:"invalid password"})

//     if (!isMatch)                                
//       return next(new ErrorHandler("Invalid Username or Password", 404));
    // If a route throws an error or next(err) is called, Express will look for a special error-handling middleware (the one with 4
    //    parameters: err, req, res, next). it will search in app.js
  
    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
  
  });
  


const getMyProfile = TryCatch(  async (req, res, next) => {
 
 const user=await User.findById(req.user);//as here password will not come bydefault 
//  set false which means we can't fetch the details
if (!user) return next(new ErrorHandler("User not found", 404));

  return res.status(200).json({ success: true 
    ,
    user
  });



});



const logout = TryCatch(async (req, res) => {
  return res
    .status(200)//just expiring the cookies maxAge=0
    .cookie("chattu-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});


// it is for searching the user 

const searchUser = TryCatch(async (req, res) => {
  const { name = "" } = req.query;//parameter passed in the url  it can be accessed by name
// when user searching for any person it should  not be the friend of that particular  user



// when the name is empty then it will give all the members 
// who is not connected with user

  // Finding All my chats exculding the group
  const myChats = await Chat.find({ groupChat: false, members: req.user });
//  extracting All Users from my chats means friends or people I have chatted with
  
const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);
// It extracts the members array from each chat, and then merges all the arrays into one flat array.

// [['Alice', 'Bob'], ['Charlie', 'Dave']]-->['Alice', 'Bob', 'Charlie', 'Dave'] it will flat them all togather in one level

 

// Finding all users except me and my friends
  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats },//it will skip those id's present in allUsersFromMyChats
    name: { $regex: name, $options: "i" },//it is for the pattern matching  eg:name-> hari search-->har
  });

  // Modifying the response
  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(200).json({
    success: true,
    users,
  });

});

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  const request = await Request.findOne({
    $or: [//to detect whether the request sent (or)  not
    //  if any one case true also it will detect that  document
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });

  if (request) return next(new ErrorHandler("Request already sent", 400));

  await Request.create({
    sender: req.user,
    receiver: userId,
  });

  emitEvent(req, NEW_REQUEST, [userId]);//this receiver will receive the notification
// here we not send the data
  return res.status(200).json({
    success: true,
    message: "Friend Request Sent",
  });
});



const acceptFriendRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;
// getting the requested id
  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");
    // generally if we did populate we will get all the data but we need sender and receiver name
// then getting the sender's name and receiver's name along with their document
  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user.toString())
    return next(//if i am not the correct receiver i will not allow to accept it 
      new ErrorHandler("You are not authorized to accept this request", 401)
    );

  if (!accept) {//not accept   request means then delete the request
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }


  // other wise create a one and one chat 
  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
      // creator: req.user,

    }),
    request.deleteOne(),
    // after creating the chat, delete the request
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getMyNotifications = TryCatch(async (req, res) => {
  // fetching all the request for the user
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender",
    "name avatar"
  );
// here just transforming the
  const allRequests = requests.map(({ _id, sender }) => ({
    _id,//it is the requested document id
    sender : {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,//inorder to fetch this one we write sender object like this otherwise we can write directly
    },
  }));

  return res.status(200).json({
    success: true,
    allRequests,
  });
});


// 2 ways it can be helpful 
// 1->to get your connected friends
// 2->if you got the chatid then you can figureout no of connected friends not part this chat/group, it can be helpfull in adding member in group
const getMyFriends = TryCatch(async (req, res) => {
  // getting all  my chated friends
  const chatId = req.query.chatId;//getting the chatid

  const chats = await Chat.find({
    members: req.user,//fetch those document whereever the user is present 

    // Fetches all non-group chats (groupChat: false) where the current user is present in the members array.
    groupChat: false,//exculded the group
  }).populate("members", "name avatar");//id will come by default



//members
// 0
// 67f23603cfa7c3d5d0eb158a
// 1
// 67f22342127ccd8eb0f75511



  const friends = chats.map(({ members }) => {
    // from each member list fetching the other user seperately
    const otherUser = getOtherMember(members, req.user);

    // getOtherMember returns the second person in a 1-on-1 chat, excluding the current user.
// it will hold id,name,avatar of the member except the req.user details

    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
  });


// if the given chat id is groupchat then it  will be helpfull in such way that to Exclude Already Added Friends in a Group Chat
  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter(
      (friend) => !chat.members.includes(friend._id)//Filters out friends who are already in that chat’s members.
      // Returns only those not yet added .



    );

    return res.status(200).json({
      success: true,
      friends: availableFriends,
      
      //this are remaining friends that can be added in the group
      // or this are friends that are connected with you but not part of this group
    });
  } else {
    return res.status(200).json({
      success: true,
      friends,
    });
  }
});


  export  {getMyFriends,getMyNotifications,acceptFriendRequest,sendFriendRequest,login,newUser,getMyProfile,logout,searchUser};