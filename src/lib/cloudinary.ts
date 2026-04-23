import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import {
  getVehicleImageFolder,
  VEHICLE_IMAGE_UPLOAD_MAX_HEIGHT,
  VEHICLE_IMAGE_UPLOAD_MAX_WIDTH,
} from "@/lib/cloudinary-images";

let isConfigured = false;

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadVehicleImageToCloudinary(options: {
  buffer: Buffer;
  vehicleId: string;
  publicId: string;
}): Promise<UploadApiResponse> {
  const client = ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        asset_folder: getVehicleImageFolder(options.vehicleId),
        public_id: options.publicId,
        resource_type: "image",
        transformation: [
          {
            crop: "limit",
            height: VEHICLE_IMAGE_UPLOAD_MAX_HEIGHT,
            width: VEHICLE_IMAGE_UPLOAD_MAX_WIDTH,
          },
        ],
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary did not return a result."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(options.buffer);
  });
}

export async function deleteCloudinaryImage(publicId: string) {
  const client = ensureCloudinaryConfig();

  return client.uploader.destroy(publicId, {
    resource_type: "image",
  });
}
