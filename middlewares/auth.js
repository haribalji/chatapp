import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";
import { adminSecretKey } from "../app.js";
import { User } from "../models/user.js";
import { CHATTU_TOKEN } from "../constants/config.js";

const isAuthenticated = TryCatch(async(req, res, next) => {

    // console.log("cookie :", req.cookies);
    const token = req.cookies["chattu-token"];
    if (!token)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  
    req.user = decodedData._id;
  // console.log(req.user);
  // console.log("hi");

    next();
  });



  const adminOnly = (req, res, next) => {
    const token = req.cookies["chattu-admin-token"];
  
    if (!token)
      return next(new ErrorHandler("Only Admin can access this route", 401));
    // const adminSecretKey = process.env.ADMIN_SECRET_KEY || "nvp";

    const secretKey = jwt.verify(token, process.env.JWT_SECRET);
    // here obtain the playload which is secret key in this case
  
    const isMatched = secretKey === adminSecretKey;
  
    if (!isMatched)//if not matched
      return next(new ErrorHandler("Only Admin can access this route", 401));
  
    next();//otherwise move to the next middleware
  };
  const socketAuthenticator = async (err, socket, next) => {
    try {
      if (err) return next(err);
  // BEACUSE OF COOKIEPARSER() IN SERVER SIDE WE ARE ABLE TO ACCESS THE TOKEN
      const authToken = socket.request.cookies[CHATTU_TOKEN];
  
      if (!authToken)
        return next(new ErrorHandler("Please login to access this route", 401));
  
      const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
  
      const user = await User.findById(decodedData._id);
  
      if (!user)
        return next(new ErrorHandler("Please login to access this route", 401));
  
      socket.user = user;//GETTING THE USER HERE
  
      return next();
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler("Please login to access this route", 401));
    }
  };


  export { isAuthenticated,adminOnly,socketAuthenticator };