


import multer from "multer";

const multerUpload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

const singleAvatar = multerUpload.single("avatar");

const attachmentsMulter = multerUpload.array("files", 5);//maximum 5 files are allowed

export { singleAvatar, attachmentsMulter };










//  const multerUpload=multer({ 

    // here default it will be storing in the temporarily storage which stored in RAM
    // 1024 bytes = 1 KB

    // 1024 * 1024 bytes = 1 MB
    
    // 1024 * 1024 * 5 bytes = 5 MB
  
//     limits:{
//         fileSize:1024*1024*5,
//     }
// });

