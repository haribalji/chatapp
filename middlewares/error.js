
import { envMode } from "../app.js";

// if any error occured it will be triggred it will catch that error
const errorMiddleware = (err, req, res, next) => {
// default values
    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;



    if (err.code === 11000) {
      // dupiacate data entered it will be executed

      // if this error is encountered then it will be executed
      const error = Object.keys(err.keyPattern).join(",");//where problem it will fetch that field
      err.message = `Duplicate field - ${error}`;
      err.statusCode = 400;
    }
  

    if (err.name === "CastError") {///if any error in "id" path then it will be executed 
      const errorPath = err.path;
      err.message = `Invalid Format of ${errorPath}`;
      err.statusCode = 400;
    }


    // return res.status(err.statusCode).json({
    //     success:false,
    //     message:err.message
    // });


    const response = {
      success: false,
      message: err.message,
    };
  
    if (envMode === "DEVELOPMENT") {
      // development mode, the error (err) will be attached to the response object, likely to help with debugging.
      
//       checks whether the current environment is development.

// response.error = err; assigns the actual error (err) to the 
// response object so it can be sent back to the frontend or logged.

// will be executed at runtime, meaning when the JavaScript code is running,
//  it checks the value of envMode. If the value is exactly the string "DEVELOPMENT", then the code inside the if block will run.
      
      response.error = err;

// "error": {
//         "statusCode": 404
//     }

// in develoment it will be added  but in production it  will not added

    }
  
    return res.status(err.statusCode).json(response);
}

// When the environment is set to "PRODUCTION", the code:
// response.error will not be attached.






// it will be used as wraper
// Flow:
// You call TryCatch and pass it your route function.
// It returns a new function with async (req, res, next) inside.
// When the route is hit, it executes your function in a try/catch.
// Any error thrown goes directly to next(error), and is handled by your errorMiddleware.



// TryCatch is a function  const TryCatch = (passedFunc) => { ... } It takes a function as an argument (passedFunc), which is typically an async route handler.
// Step 2: TryCatch returns another function (req, res, next) => { ... }
// Step 3: Inside that function, it calls the passed function in a try-catch

const TryCatch = (passedFunc) => async (req, res, next) => {
    // TryCatch returning function how it gets value?
    // is the wrapper, and it receives the req, res, and next values from Express, not from the passedFunc.
    
    
    try {
      await passedFunc(req, res, next);
    } catch (error) {
      next(error);
    }
  };
  
  export { errorMiddleware, TryCatch };