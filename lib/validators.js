import { body, check, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);
    // If errors exist:                                    
   // It collects all error messages (error.msg) into an array.
  // Joins them into a single string (comma-separated).
//  console.log(errors)
  const errorMessages = errors
    .array()


    // .array() returns:
    // An array of error objects,
    //  where each object looks like this:
    // [
    //   {
    //     value: "",                 // The actual invalid value received
    //     msg: "Please Enter Name",  // The error message you defined in the validator
    //     param: "name",             // The name of the field with the error
    //     location: "body"           // Where it was checked (body, query, params, etc.)
    //   },
    //   {
    //     value: "",
    //     msg: "Please Enter Password",
    //     param: "password",
    //     location: "body"
    //   }
    // ]
    .map((error) => error.msg)//here it will extract the error msg from each array element
    .join(", ");//Joins all the erroe messages  into one string for easy output.

  if (errors.isEmpty()) return next();//if no error we will move to next middleware
  else next(new ErrorHandler(errorMessages, 400));
};

const registerValidator = () => [
    // checking whether all the data present or not if not raise error
  body("name", "Please Enter Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  // adds validation rules for the request body
  // This function returns an array of validation rules using express-validator.
// check("avatar","please upload Avatar").notEmpty().withMessage(""),

];

const loginValidator = () => [
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];

const newGroupValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members")
  // here multiple conditions are checked
    .notEmpty()//with respect to the empty it will called
    .withMessage("Please Enter Members")
    .isArray({ min: 2, max: 100 })//with respect to the array size  this error will be raised
    .withMessage("Members must be 2-100"),
];

const addMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })//if already three memebers means
    .withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("userId", "Please Enter User ID").notEmpty(),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  // check("files","please upload files").notEmpty().withMessage("please Upload Attachment")
  // .isArray({ min: 1, max: 5 })
  // .withMessage("Members must be 1-5"),
];

const chatIdValidator = () => [
  param("id", "Please Enter Chat ID").notEmpty()
  //from the param's we get the chat_id 
]; 

const renameValidator = () => [
  param("id", "Please Enter Chat ID").notEmpty(),
  body("name", "Please Enter New Name").notEmpty(),
];

const sendRequestValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];


const acceptRequestValidator = () => [
  body("requestId", "Please Enter Request ID").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];

const adminLoginValidator = () => [
  body("secretKey", "Please Enter Secret Key").notEmpty(),
];

export {
  acceptRequestValidator,
  addMemberValidator,
  adminLoginValidator,
  chatIdValidator,
  loginValidator,
  newGroupValidator,
  registerValidator,
  removeMemberValidator,
  renameValidator,
  sendAttachmentsValidator,
  sendRequestValidator,
  validateHandler,
};