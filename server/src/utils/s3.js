import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (localFilePath, originalName, mimeType) => {
  try {
    if (!localFilePath) return null;

    // Read file content
    const fileContent = fs.readFileSync(localFilePath);

    // Generate unique key (filename)
    // Generate a perfectly unique filename using crypto (e.g. 550e8400-e29b.png)
    const fileExtension = path.extname(originalName);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    
    // 3. Create the S3 upload command
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFilename, // "Key" is S3-speak for "filename"
      Body: fileContent,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // remove the locally saved temporary file
    fs.unlinkSync(localFilePath); 

    // Return the generated public URL
    // Remove any trailing slashes from the environment variable just in case
    const publicEnv = process.env.R2_PUBLIC_URL || "";
    const baseUrl = publicEnv.replace(/\/$/, "");
    const publicUrl = baseUrl ? `${baseUrl}/${uniqueFilename}` : `https://missing-env/${uniqueFilename}`;

    return {
      secure_url: publicUrl,
      public_id: uniqueFilename,
    };

  } catch (error) {
    console.error("🔥 S3/R2 UPLOAD ERROR:", error);
    // remove the locally saved temporary file as the upload operation got failed
    try { fs.unlinkSync(localFilePath); } catch(e) {} 
    return null;
  }
}

export { uploadToS3 };
