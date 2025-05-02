// import { userSocketIDs } from "../app.js";

import { userSocketIDs } from "../app.js";

export const getOtherMember = (members, userId) =>
  members.find((member) => member._id.toString() !== userId.toString());
// what are the id doesn't match it will be returned


// export const getSockets = (users = []) => {
//   const sockets = users.map((user) => userSocketIDs.get(user.toString()));

//   return sockets;
// };

// export const getBase64 = (file) =>
//   `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;


// export const getSockets = (users = []) => {
//   // here we are fetching the corresponding user id ka socket id
//   const sockets = users.map((user) => userSocketIDs.get(user.toString()));
// console.log(sockets)
//   return sockets;
// };
export const getSockets = (users = []) => {
  console.log(users)
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));
console.log(sockets)

  return sockets;
};

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

