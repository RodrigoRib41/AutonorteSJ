import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_VEHICLES_CACHE_TAG } from "@/lib/public-vehicle-queries";

export function revalidatePublicVehiclePages(vehicleId?: string) {
  revalidateTag(PUBLIC_VEHICLES_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/vehiculos");

  if (vehicleId) {
    revalidatePath(`/vehiculos/${vehicleId}`);
  }
}
