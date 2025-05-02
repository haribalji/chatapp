import express from "express";
import {
  adminLogin,
  adminLogout,
  allChats,
  allMessages,
  allUsers,
  getAdminData,
  getDashboardStats,
} from "../controllers/admin.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// admin login
app.post("/verify", adminLoginValidator(), validateHandler, adminLogin);

app.get("/logout", adminLogout);


// the above route can accessed by any one but below route can be accessed by only admin
// Only Admin Can Accecss these Routes

// middleware will be  to block other user's other than admin
app.use(adminOnly);

app.get("/", getAdminData);

app.get("/users", allUsers);//it is used for fetching all the user
app.get("/chats", allChats);
app.get("/messages", allMessages);

console.log(
  // hari
)
app.get("/stats", getDashboardStats);

export default app;