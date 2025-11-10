// utils/cloudinaryUpload.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import streamifier from 'streamifier';

dotenv.config();
// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/**
 * Uploads a file to Cloudinary.
 * Accepts either:
 *  - localPath: string path to file (cloudinary.uploader.upload)
 *  - or an object { buffer, filename, folder } to upload buffer via upload_stream
 *
 * @param {string | {buffer: Buffer, filename?: string, folder?: string}} fileOrPath
 * @param {Object} options (optional) - additional upload options
 * @returns {Promise<Object>} - Cloudinary upload response
 */
export async function handleUpload(fileOrPath, options = {}) {
  // If a string path is provided, fall back to uploader.upload (keeps backwards compatibility)
  if (typeof fileOrPath === "string") {
    try {
      const result = await cloudinary.uploader.upload(fileOrPath, {
        resource_type: "auto",
        ...options,
      });
      return result;
    } catch (err) {
      console.error("Cloudinary upload (path) failed:", err);
      throw new Error("Upload to Cloudinary failed");
    }
  }

  // Otherwise expect object with buffer
  const { buffer, filename, folder } = fileOrPath || {};
  if (!buffer || !(buffer instanceof Buffer)) {
    throw new Error("No buffer provided for upload");
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: "auto",
      folder: folder || options.folder,
      public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload_stream error:", error);
          return reject(new Error("Upload to Cloudinary failed"));
        }
        resolve(result);
      }
    );

    // convert buffer to readable stream and pipe to upload_stream
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Deletes a file from Cloudinary using its public_id.
 * @param {string} publicId
 * @returns {Promise<Object>}
 */
export async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) {
      throw new Error("Missing publicId for Cloudinary deletion");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    if (result.result === "ok") {
      console.log(`Cloudinary file deleted: ${publicId}`);
    } else {
      console.warn(`Cloudinary deletion returned: ${result.result}`);
    }
    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}
