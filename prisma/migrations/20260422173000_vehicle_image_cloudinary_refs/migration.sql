-- Store only stable Cloudinary references and lightweight metadata.
-- Rendered variants are generated at delivery time with Cloudinary transformations.

ALTER TABLE "VehicleImage"
  ADD COLUMN IF NOT EXISTS "assetId" TEXT,
  ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER,
  ADD COLUMN IF NOT EXISTS "format" TEXT,
  ADD COLUMN IF NOT EXISTS "bytes" INTEGER;

UPDATE "VehicleImage"
SET "isPrimary" = ("sortOrder" = 0)
WHERE "isPrimary" = false;

ALTER TABLE "VehicleImage"
  DROP COLUMN IF EXISTS "url";

CREATE UNIQUE INDEX IF NOT EXISTS "VehicleImage_assetId_key"
  ON "VehicleImage"("assetId");

CREATE INDEX IF NOT EXISTS "VehicleImage_vehicleId_isPrimary_idx"
  ON "VehicleImage"("vehicleId", "isPrimary");
