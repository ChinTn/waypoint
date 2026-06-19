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
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// The frontend sends the HTTP request.
// The request hits upload.single("file").
// Multer reads the incoming data, saves the physical file to ./public/temp, and then mutates the req object in memory by dynamically injecting a brand new property onto it called req.file.
// Inside that new req.file object, Multer has populated all the details about the file it just saved:
// req.file.path (the string location on your hard drive, e.g., "public/temp/file-123.png")
// req.file.originalname (e.g., "screenshot.png")
// req.file.mimetype (e.g., "image/png")
// req.file.size (e.g., 1024500 bytes)
// Once Multer finishes building that object, it calls next(), which hands the mutated req object over to your uploadTaskFile controller.
// Your controller runs, looks at req.file.path, and hands that path to the Cloudflare S3 uploader.
// So the file path is never in the URL! It is generated dynamically by Multer, injected into the req object as JavaScript data, and passed down the chain to your controller.