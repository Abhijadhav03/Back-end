import { v2 } from "cloudinary";
import fs from "fs";
import path from "path";

const cloudinary = v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadImage = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log("Image uploaded successfully:", result.url);
    
    return result;
  } catch (error) {
    fs.unlinkSync(filePath); // Clean up the file after upload
    if (error.http_code === 400) {
      console.error("Bad request error:", error);
    }
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};
export { cloudinary, uploadImage };
