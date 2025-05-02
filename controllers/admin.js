import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOptions } from "../utils/features.js";
import { adminSecretKey } from "../app.js";

const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;
  // const adminSecretKey = process.env.ADMIN_SECRET_KEY || "nvp";

  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

  const token = jwt.sign(secretKey, process.env.JWT_SECRET);
// here  we are creating the token
  return res
    .status(200)
    .cookie("chattu-admin-token", token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,//15 mins
    })
    .json({
      success: true,
      message: "Authenticated Successfully, Welcome BOSS",
    });
});

const adminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("chattu-admin-token", "", {
      ...cookieOptions,
      maxAge: 0,//making the cookies to expire
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

const getAdminData = TryCatch(async (req, res, next) => {
  // to check current user able to use admin and to verify whether the middleware is working
  return res.status(200).json({
    admin: true,
  });
});

const allUsers = TryCatch(async (req, res) => {
  const users = await User.find({});//fetching all the user data
console.log(users);
console.log("hlllll");

//inside also promise statement is there  so only outside also promise is there  to  do all the process once  until we need to wait
  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [groups, friends] = await Promise.all([
        // here we are calculating the no of groups 
        // and no of friends that current "id" connected with
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        groups,
        friends,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    users: transformedUsers,
  });
});

const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")//populate will replace the corresponding 
    // reference document then filter will happen
    .populate("creator", "name avatar");//got from the user document only

  const transformedChats = await Promise.all(//waiting until all the execution complete
// here we are obtaining the total no of messages with respect to the corresponding id
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
    //  it will be called for each iteration
        const totalMessages = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupChat,
        name,
// from each chat we are picking only limited no of avatar
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
            // formating the member data and it will return it automatically   
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
            // in group chat it is useful
        
          name: creator?.name || "None",
        //   id: creator?.id || "None",

          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    chats: transformedChats,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");
    // here the chat document will be replaced from there the groupChat is extracted
    // to identify whether it is group or indivdual chat
  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat._id,//by default we can fetch the id
      groupChat: chat.groupChat,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
})
);
  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  console.log("hello")

  const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),//counting only the group chat
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),//all the chats
    ]);
console.log("hello")
  const today = new Date();
// here we collecting the data last 7 days
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  // This sets the day of the month to the result, effectively changing
  //  "last7Days" -->7 days before today.
// If "last7Days" was April 15, it becomes April 8.  2025-04-08T07:00:39.324Z
// console.log(last7Days)

console.log("hello")

const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,//date greater than equal
      $lte: today,//date less than equal to today
    },
  }).select("createdAt");  //w.r.t  this field the condition will be applied

  const messages = new Array(7).fill(0);//array will  be ceeated with 7 ->0
  const dayInMiliseconds = 1000 * 60 * 60 * 24;
// 1s*60=60s*60=1hour*24=24 hour
  last7DaysMessages.forEach((message) => {
    // fetching each message
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
      // (today.getTime() - message.createdAt.getTime()) it's o/p will be in the milliseconds so / by daymillinseconds
      // gives the number of days before this message was  created  -> by giving a index value
      const index = Math.floor(indexApprox);//to remove the floating number and get the whole no
      // messages[6] → today,messages[0] → 6 days ago
    messages[6 - index]++;
    // If   a message is 1 day ago, index = 1, so messages[5]++


  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

export {
  allUsers,
  allChats,
  allMessages,
  getDashboardStats,
  adminLogin,
  adminLogout,
  getAdminData,
};