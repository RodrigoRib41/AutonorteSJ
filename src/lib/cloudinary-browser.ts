"use client";

import {
  getVehicleImagePublicId,
  validateVehicleImageBytes,
} from "@/lib/cloudinary-images";

export type CloudinaryUploadResult = {
  asset_id: string;
  public_id: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  secure_url: string;
};

function isCloudinaryUploadResult(
  value: unknown
): value is CloudinaryUploadResult {
  return Boolean(value) &&
    typeof value === "object" &&
    typeof (value as CloudinaryUploadResult).asset_id === "string" &&
    typeof (value as CloudinaryUploadResult).public_id === "string" &&
    typeof (value as CloudinaryUploadResult).secure_url === "string";
}

async function hashFile(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(digest));

  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validateBytes(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return validateVehicleImageBytes(bytes);
}

function getUploadPreset() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? "";
}

function getCloudName() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";
}

export async function uploadVehicleImageFromBrowser(options: {
  file: File;
  vehicleId: string;
}): Promise<CloudinaryUploadResult> {
  const uploadPreset = getUploadPreset();
  const cloudName = getCloudName();

  if (!uploadPreset || !cloudName) {
    throw new Error(
      "Falta configurar Cloudinary para carga directa desde el navegador."
    );
  }

  const invalidBytesMessage = await validateBytes(options.file);

  if (invalidBytesMessage) {
    throw new Error(invalidBytesMessage);
  }

  const publicId = getVehicleImagePublicId(
    options.vehicleId,
    await hashFile(options.file)
  );
  const formData = new FormData();
  formData.append("file", options.file);
  formData.append("upload_preset", uploadPreset);
  formData.append("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  const result = (await response.json().catch(() => null)) as
    | CloudinaryUploadResult
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !result || "error" in result || !isCloudinaryUploadResult(result)) {
    throw new Error(
      result && "error" in result
        ? result.error?.message ?? "No pudimos subir la imagen a Cloudinary."
        : "No pudimos subir la imagen a Cloudinary."
    );
  }

  return result;
}
