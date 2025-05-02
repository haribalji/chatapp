import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import { addMemberValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();

//when this path is matched then it will be executed
app.use(express.json());



// after here user must be logined to access the routes


app.use(isAuthenticated);///instead of adding in the each router 
// we can add here itself after execution of it only we will move 
// forward so we need not write this middle ware again and again


// this route is for creating new group chat
app.post("/new",newGroupValidator(),validateHandler,newGroupChat)
app.get("/my",getMyChats)
app.get("/my/groups",getMyGroups);

app.put("/addmembers",addMemberValidator(),validateHandler,addMembers);//this route for adding the member

app.put("/removemember",removeMemberValidator(),validateHandler,removeMember);//this route for adding the member


app.delete("/leave/:id",chatIdValidator(),validateHandler,leaveGroup);//this expecting the id at the end


// send attachments

app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachments
);

// fetching messages belong to that particular group


app.get("/message/:id",chatIdValidator(),validateHandler,getMessages)

//get chat ,edit chat ,delete chat here according to the http method the function will be called

// here we are keeping this router in the bottom it can match with other router in some case
app.route("/:id").get(chatIdValidator(),validateHandler,getChatDetails).put(renameValidator(),validateHandler,renameGroup).delete(chatIdValidator(),validateHandler,deleteChat);

export default app;

