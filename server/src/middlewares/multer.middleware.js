import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // We will save files temporarily in a local 'public/temp' directory before uploading to Cloudinary
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})

export const upload = multer({ 
    storage, 
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
