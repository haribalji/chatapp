import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { deletFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { User } from "../models/user.js";
import { Message } from "../models/message.js";

const newGroupChat = TryCatch(async (req, res, next) => {
    const { name, members } = req.body;//we need this both parameter for creating the groupchat
  console.log(members)
          if(members.length<2)
    // if  member below 2 return error
    return next(
        new ErrorHandler("Group chat must have at leasst 3 members",400)
    )






    const allMembers = [...members, req.user];//add group members and me
  
    await Chat.create({
      name,
      groupChat: true,
      creator: req.user,
      members: allMembers,
    });
  
    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    // when the group is created for everyone the alert will be sent
    emitEvent(req, REFETCH_CHATS, members);
    // emitEvent: This is a custom function (likely defined elsewhere) that wraps socket or event emission logic.
    // members: An array of user IDs or socket IDs that should receive the event.
    return res.status(201).json({
      success: true,
      message: "Group Created",
    });



  });




  const getMyChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user }).populate(
      "members",
      "name avatar"
    );
    // Finds all Chat documents who's members list mai our user is present. //by matching the id

    // For each chat, it replaces the members (ObjectIds) with full User documents.
    
    // But only includes the name and avatar fields from the User collection of that particular chat.

// by using the populate func the output will be
// "members": [
//                 {
//                     "avatar": {
//                         "public_id": "lift_although.ics",
//                         "url": "https://avatars.githubusercontent.com/u/972260"
//                     },
//                     "_id": "67f3b4edc7248b87c0630ac1",
//                     "name": "Curtis Daniel"
//                 },
//                 {
//                     "avatar": {
//                         "public_id": "who_apud.mpga",
//                         "url": "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/91.jpg"
//                     },
//                     "_id": "67f3b4edc7248b87c0630ac4",
//                     "name": "Mr. Geoffrey Turner"
//                 },
//                 {
//                     "avatar": {
//                         "public_id": "sdf",
//                         "url": "sdvsd"
//                     },
//                     "_id": "67f28312556ec12ae155bbef",
//                     "name": "hari"
//                 }
//             ],





  
const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
const otherMember = getOtherMember(members, req.user);
return{
        _id,
        groupChat,
        avatar: groupChat
        // If it’s a group chat:

        // Take the first 3 members only using .slice(0, 3)
        
        // Map  or getting their avatar.urls into an array.from here getting the avatar url ths 

        // "members": [
//                 {
//                     "avatar": {
//                         "public_id": "lift_although.ics",
//                         "url": "https://avatars.githubusercontent.com/u/972260"
//                     },
//                     "_id": "67f3b4edc7248b87c0630ac1",
//                     "name": "Curtis Daniel"
//                 },      
// If it's a private chat: Just return the avatar URL of the other member (not the current user).  

          ? members.slice(0, 3).map(({ avatar }) => avatar.url) 
          : [otherMember.avatar.url],//if the group chat didn't exisits othermemeber url will be displayed
        name: groupChat ? name : otherMember.name,
        members: members.reduce((prev, curr) => {//getting only members id excluding user's one
//   members is an array of user objects (from .populate("members"))
// .reduce() is used to build a new array (prev) that contains only 
// getting the ids of other users (not the current one)
          
// prev → the array we’re building (starts as [])
// curr → the current user object in the members array
          
          if (curr._id.toString() !== req.user.toString()) {
            prev.push(curr._id);
          }
          return prev;//it will be executed in each iteration
          // In it's each return the prev gets updated  with the  updated new value
        }, []),//here the intial prev  state will be empty
      };
    });

  
    return res.status(200).json({
      success: true,
      chats: transformedChats,//data of all the chats connected with this user
    });
  });

// here only we show our groups  which is created current user
  const getMyGroups = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({
      members: req.user,//whichever group i am 
      groupChat: true,
      creator: req.user,
    }).populate("members", "name avatar");
  

    // here just transforming the data
    const groups = chats.map(({ members, _id, groupChat, name }) => ({

      _id,
      groupChat,
      name,
      avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
      // Take the first 3 members only using .slice(0, 3)

    }));
  
    return res.status(200).json({
      success: true,
      groups,
    });
  });



// Here adding members will take place

// it is the higher order function

  const addMembers = TryCatch(async (req, res, next) => {
    const { chatId, members } = req.body;
    // alert("helllo")
  // if the memebers not exisits then return message
    // if(!members||members.length<1)return next(new ErrorHandler("Please Provide members",400))
    const chat = await Chat.findById(chatId);//ANY CHANGES HAPPEN IT WILL THIS PARTICUAL DOCUMENT ONLY
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));
  
    if (chat.creator.toString() !== req.user.toString())//if the adding member is not the admin then there are not allowed to add
      return next(new ErrorHandler("You are not allowed to add members", 403));
  

    // figuring out all the member from the db
    const allNewMembersPromise = members.map((i) => User.findById(i, "name")); 
    //This maps each member ID to a promise, created by User.findById().
    // [
    //   Promise { <pending> }, 
    //   Promise { <pending> },   it will look like this 
    //   Promise { <pending> }
    // ]
    const allNewMembers = await Promise.all(allNewMembersPromise);
    // This runs all those queries in parallel and waits for all of them to finish.
    // Once they're all done, it gives you an array of the user data
    //  (with only name field in each object).





    const uniqueMembers = allNewMembers//IF THE DUPLICATE USERE COMING AGAIN AND AGAIN IT WILL BE NEGLECTED
      .filter((i) => ! chat.members.includes(i._id.toString()))//Checks if i._id is not already in chat.members


      .map((i) => i._id);
      // This gives you only the _ids of users who are not already in the chat.

// before insertion ["user1", "user4"]

    chat.members.push(...uniqueMembers);
    // It pushes each value individually from uniqueMembers into chat.members
   
    // chat.members.push(...["user2", "user3"]);
// or  both same
// chat.members.push("user2", "user3");
// after
// ["user1", "user4", "user2", "user3"] now your chat.members becomes:


    if (chat.members.length > 100) //setting group limit beyond 100 not allowed
      return next(new ErrorHandler("Group members limit reached", 400));
  
    await chat.save();// it will be saved in that particular collection
   
   
   
    const allUsersName = allNewMembers.map((i) => i.name).join(", ");
  // ["A","B"] JOIN WILL MAKE into one STRING OF ELEMENT-->"A,B"

    emitEvent(
      req,
      ALERT,
      chat.members,
      `${allUsersName} has been added in the group`
    );
  
    emitEvent(req, REFETCH_CHATS, chat.members);
  
    return res.status(200).json({
      success: true,
      message: "Members added successfully",
    });
  });



  const removeMember = TryCatch(async (req, res, next) => {
    const { userId, chatId } = req.body;
    // alert("hello");
    const [chat, userThatWillBeRemoved] = await Promise.all([
      Chat.findById(chatId), // Fetch the chat document
      User.findById(userId, "name"),   // Fetch the user to be removed, but only return their name
    ]); // here iy will execute all the queries parallely and bring the chat id and userid 
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));
  
    if (chat.creator.toString() !== req.user.toString())
      return next(new ErrorHandler("You are not allowed to remove members as your not admin", 403));
  
    if (chat.members.length <= 3)
      return next(new ErrorHandler("Group must have at least 3 members", 400));
  
    const allChatMembers = chat.members.map((i) => i.toString());

    // allChatMembers=[
    // 67f3b4edc7248b87c0630ac1
    // 67f3b4edc7248b87c0630ac4
    // 67f28312556ec12ae155bbef
    // 67f3b4edc7248b87c0630ac6
    // ]
    
    chat.members = chat.members.filter(//neglecting the user only
      (member) => member.toString() !== userId.toString()//now the array is updated in  
      // such way that it will hold only those member who is not userid
    );
  
    await chat.save();
  
    emitEvent(req, ALERT, chat.members, {
      message: `${userThatWillBeRemoved.name} has been removed from the group`,
      chatId,
    });
  
    emitEvent(req, REFETCH_CHATS, allChatMembers);
  
    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  });


  const leaveGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;//id <--this  and url variable "id" should be same then only we get the url data
  
    const chat = await Chat.findById(chatId);
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));
  
 if(! chat.members.includes(req.user.toString()))//Checks if i._id is not already in chat.members
{
  // if the user not present in group means
  return next(new ErrorHandler("This particular user not in the group", 400));



}
    // if the admin itself leaving?
    const remainingMembers = chat.members.filter(
      (member) => member.toString() !== req.user.toString()
      // this user id you got from the authentication
    );
  
    if (remainingMembers.length < 3)
      return next(new ErrorHandler("Group must have at least 3 members", 400));
  


    // if the admin itself leaving the group then then we need to create new group with remaining members
    if (chat.creator.toString() === req.user.toString()) {
      // selecting the random admin from the available remainingmembers 
      const randomElement = Math.floor(Math.random() //➝ Generates a random decimal number between 0 (inclusive) and 1 (exclusive).

      * remainingMembers.length);
      // If remainingMembers.length = 5, this could * math.random() give something like 2.47.
      // Math.floor()
      // ➝ Rounds the number down to the nearest whole number.
      // So 2.47 becomes 2.
      // randomElement = 0, 1, 2, ..., remainingMembers.length - 1  possible index

      const newCreator = remainingMembers[randomElement];
      chat.creator = newCreator;
    }
  
    chat.members = remainingMembers;
  // this user value that we got from the  authentication
    const [user] = await Promise.all([
      User.findById(req.user, "name"),
      chat.save(),
      //  executing two asynchronous operations in parallel 
      // it will excute all and wait untill it fully resolve
    ]);
  // note if the user already left the group ,if trying to remove the same person again and again then it will that "user leave group"
    emitEvent(req, ALERT, chat.members, {
      chatId,
      message: `User ${user.name} has left the group`,
    });
  
    return res.status(200).json({
      success: true,
      message: "Leave Group Successfully",
    });
  });



  const sendAttachments = TryCatch(async (req, res, next) => {
    const { chatId } = req.body;//here picking the groupid
    console.log(chatId);

    const files = req.files || [];
  
    if (files.length < 1)
      return next(new ErrorHandler("Please Upload Attachments", 400));
  
    if (files.length > 5)
      return next(new ErrorHandler("Files Can't be more than 5", 400));
  
    const [chat, me] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user, "name"),
    ]);
  //here me pointing to current user  obtained by req.user
  // chat is representing that particular group
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (files.length < 1)
      return next(new ErrorHandler("Please provide attachments", 400));
    console.log("allo ok ");

    //   Upload files here
    const attachments = await uploadFilesToCloudinary(files);
    // const attachments = [];

    const messageForDB = {
      content: "",
      attachments,
      sender: me._id,//who send the message
      chat: chatId,
    };
  

    // preparing a message object to be sent in real-time by websocket
    const messageForRealTime = {
      ...messageForDB,
       sender: {//adds the sender field in the final object which overides the old one
        _id: me._id,
        name: me.name,
      },
    };
  
    const message = await Message.create(messageForDB);
  
    emitEvent(req, NEW_MESSAGE, chat.members, {
      message: messageForRealTime,
      chatId,
    });
  
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
  
    return res.status(200).json({
      success: true,
      message,
    });
  });


  const getChatDetails = TryCatch(async (req, res, next) => {
    // if it is truecorresponding group chat details need to fetched 
    if (req.query.populate === "true") {
      // here the content will be filtered
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();
        console.log(chat)
      // This does not skip any other fields in the Chat document itself 

        // replace the members field (which contains just ObjectIds) with actual user documents, but only include
        //  the name and avatar fields from each user.
        // The _id (user ID) comes by default when you populate 
        // Before populate:
        // members: [ObjectId("123"), ObjectId("456")]
      
        // After populate:
        // members: [
        //   { _id: "123", name: "Alice", avatar: { url: "..." } },
        //   { _id: "456", name: "Bob", avatar: { url: "..." } }
        // ]

        // The .lean() method in Mongoose is used to return plain 
        // JavaScript objects instead of full Mongoose documents.
       // It's faster and uses less memory.


  // without lean()
//   It has all Mongoose document methods like .save(), .validate(), etc.
// Slightly heavier because of added metadata and helper functions

      if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
      chat.members = chat.members.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
      }));
            // before mapping:

      // {
      //   _id: "user1",
      //   name: "Alice",
      //   avatar: {
      //     url: "https://cdn/avatar1.jpg",
      //     public_id: "abc123"
      //   }
      // }

      // After mapping:
     
      // {
      //   _id: "user1",
      //   name: "Alice",
      //   avatar: "https://cdn/avatar1.jpg"
      // }
      return res.status(200).json({
        success: true,
        chat,
      });
    } else {
      // here the content will be displayed without any filtered
      const chat = await Chat.findById(req.params.id);
      if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
      return res.status(200).json({
        success: true,
        chat,
      });
    }
  });
  


  const renameGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;//get the group id
    const { name } = req.body; ///get the new name 
  
    const chat = await Chat.findById(chatId);
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));
  
    if (chat.creator.toString() !== req.user.toString())
      return next(
        new ErrorHandler("You are notadmin not  allowed to rename the group", 403)
      );
  console.log(name)
    chat.name = name;
  
    await chat.save();
  
    emitEvent(req, REFETCH_CHATS, chat.members);
  
    return res.status(200).json({
      success: true,
      message: "Group renamed successfully",
    });
  });
  

  const deleteChat = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
  
    const chat = await Chat.findById(chatId);
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    const members = chat.members;
  
    if (chat.groupChat && chat.creator.toString() !== req.user.toString())
      return next(//if your not an admin or this is not  group then not allowed to delete the group
        new ErrorHandler("You are  not allowed to delete the group", 403)
      );
  // "*"
    if (chat.groupChat && !chat.members.includes(req.user.toString())) {
      return next(//if it is not a group and your not a member of this group
        new ErrorHandler("You are not allowed to delete the chat", 403)
      );
    }
  
    //   Here we have to dete All Messages as well as attachments or files from cloudinary
  
    const messagesWithAttachments = await Message.find({
      chat: chatId,//searching the Message collection for all messages that:

      //Belong to a specific chat (chat: chatId)
      attachments: { $exists: true, $ne: [] },



    //  attachments: { $exists: true }


      // Only include documents where the attachments field is present — it exists.
// eg of matching
// {
//   attachments: []
// }

// {
//   attachments: [{ url: "file.jpg" }]
// }

// wil not match

// {
//   // no attachments field at all
// }

// attachments: { $ne: [] }:Only include documents where the attachments field is not equal to an empty array.

// it will match attachments: [{ url: "file.jpg" }]
// it will not match--> attachments: []



// by combined both  ut can match with
// {
//   chat: "abc123",
//   attachments: [{ url: "file1.jpg" }]
// }
    });
  
    const public_ids = [];
  //getting the public id of all the attachment
    messagesWithAttachments.forEach(({ attachments }) =>//getting the attachment first
      attachments.forEach(({ public_id }) => public_ids.push(public_id))
      // from that getting the public id next and push inside the public_ids
    );
    await Promise.all([
      deletFilesFromCloudinary(public_ids),//deleting all the messages belong to this group in cloud
      chat.deleteOne(),//deleteing that group/chat
      Message.deleteMany({ chat: chatId }),//deleting all the message belong to this group/chat
    ]);
  
    emitEvent(req, REFETCH_CHATS, members);
  
    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  });
  

  const getMessages = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
  
    const resultPerPage = 20;
    const skip = (page - 1) * resultPerPage;
    // eg page=1 that time page-1-->0 so we need to skip  0 messages at intial
  
    const chat = await Chat.findById(chatId);
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (!chat.members.includes(req.user.toString()))
      return next(//if your not part of this group your not allowed to see this group message
        new ErrorHandler("You are not allowed to access this chat", 403)
      );
  
    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 }) // Sort messages in descending order of creation
        // -1 indicates descending order (from the most recent to the oldest).
        // If you wanted to sort in ascending order (oldest to newest), you would use 1 instead of -1

        .skip(skip)//from the avaiable total messages it will skip {skip} messages
        .limit(resultPerPage)//per-page the maximum number of the  data will be given
        .populate("sender", "name")//from the available messages  it will applied only inside the sender field
        //  populate only works with references  as sender refering something
      
        .lean(),// Return plain JS objects instead of Mongoose documents
      Message.countDocuments({ chat: chatId }),
    ]);
  // here we say total number of pages
    const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;
  
    return res.status(200).json({
      success: true,
      messages: messages.reverse(),//new messages present in the bottom or at the last
      totalPages,
    });
  });

export {getMessages,newGroupChat,getMyChats,getMyGroups,addMembers,removeMember,leaveGroup,sendAttachments,getChatDetails
 , renameGroup,
 deleteChat
};