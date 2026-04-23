DO $$
BEGIN
  CREATE TYPE "VehicleCategory" AS ENUM (
    'CAR',
    'PICKUP',
    'SUV',
    'MOTORCYCLE',
    'VAN',
    'TRUCK',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS "category" "VehicleCategory" NOT NULL DEFAULT 'CAR';

ALTER TABLE "VehicleRestorePoint"
  ADD COLUMN IF NOT EXISTS "summary" TEXT;

CREATE INDEX IF NOT EXISTS "Vehicle_category_deletedAt_idx"
  ON "Vehicle"("category", "deletedAt");
