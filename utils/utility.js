class ErrorHandler extends Error {
    constructor(message, statusCode) {
      super(message);//Error class  constractor ka liya message will be sent
      this.statusCode = statusCode;
    }}
export { ErrorHandler };