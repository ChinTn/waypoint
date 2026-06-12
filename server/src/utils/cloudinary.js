import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Automatically detect image, video, or raw file
        });
        
        // remove the locally saved temporary file
        fs.unlinkSync(localFilePath); 
        return response;

    } catch (error) {
        console.error("🔥 CLOUDINARY UPLOAD ERROR:", error);
        // remove the locally saved temporary file as the upload operation got failed
        try { fs.unlinkSync(localFilePath); } catch(e) {} 
        return null;
    }
}

export { uploadOnCloudinary };
