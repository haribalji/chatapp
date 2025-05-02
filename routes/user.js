import express from "express"
import { acceptFriendRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../controllers/user.js";//Here the extension should be correct
import { singleAvatar } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";

const app=express.Router();

//when this path is matched then it will be executed
app.use(express.json());

/// here in the muter we send only single file only and it's file type
app.post("/new",
  
    singleAvatar,
    registerValidator(),
    validateHandler,
  // like this it will be executed 
 // validationResult(req) collects errors found by express-validator.
// If there are no errors (errors.isEmpty()), it moves to the next middleware.


    newUser);

  // app.post("/new",newUser);

app.post("/login",loginValidator(),validateHandler,login);

// after here user must be logined to access the routes


app.use(isAuthenticated);///instead of adding in the each router 
// we can add here itself after execution of it only we will move 
// forward so we need not write this middle ware again and again

app.get("/me",getMyProfile);

// logout router
app.get("/logout",logout);


// here now we need to perform the search user
app.get("/search",searchUser)

app.put("/sendrequest",sendRequestValidator(),validateHandler,sendFriendRequest)

app.put(
  "/acceptrequest",
  acceptRequestValidator(),
  validateHandler,
  acceptFriendRequest
);



app.get("/notifications", getMyNotifications);



app.get("/friends",getMyFriends
)
export default app;