// filename: backend/src/utils/cloudinary.config.ts
// Version: 1.0.0 (Standard - Using process.env)
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error("ERROR: Cloudinary environment variables are missing!"); // ... resto del mensaje de error ...
} else {
   console.log("[Cloudinary Config] Credentials found from .env, configuring Cloudinary SDK...");
   cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
   console.log("[Cloudinary Config] Cloudinary SDK configured successfully from .env.");
}
export default cloudinary;