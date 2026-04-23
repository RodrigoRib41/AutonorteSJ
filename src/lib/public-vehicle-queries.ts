import { unstable_cache } from "next/cache";

import type { VehicleFilterValues } from "@/lib/vehicle-filters";
import {
  getFeaturedVehicles,
  getPaginatedVehicles,
  getVehicleBrands,
  getVehicleById,
  getVehicleCount,
} from "@/lib/vehicle-queries";

export const PUBLIC_VEHICLES_CACHE_TAG = "public-vehicles";
export const PUBLIC_VEHICLES_REVALIDATE_SECONDS = 300;

export const getPublicFeaturedVehicles = unstable_cache(
  async (limit = 3) => getFeaturedVehicles(limit),
  ["public-featured-vehicles"],
  {
    revalidate: PUBLIC_VEHICLES_REVALIDATE_SECONDS,
    tags: [PUBLIC_VEHICLES_CACHE_TAG],
  }
);

export const getPublicPaginatedVehicles = unstable_cache(
  async (
    filters?: VehicleFilterValues,
    options?: {
      skip?: number;
      take?: number;
    }
  ) => getPaginatedVehicles(filters, options),
  ["public-paginated-vehicles"],
  {
    revalidate: PUBLIC_VEHICLES_REVALIDATE_SECONDS,
    tags: [PUBLIC_VEHICLES_CACHE_TAG],
  }
);

export const getPublicVehicleById = unstable_cache(
  async (id: string) => getVehicleById(id),
  ["public-vehicle-by-id"],
  {
    revalidate: PUBLIC_VEHICLES_REVALIDATE_SECONDS,
    tags: [PUBLIC_VEHICLES_CACHE_TAG],
  }
);

export const getPublicVehicleBrands = unstable_cache(
  async () => getVehicleBrands(),
  ["public-vehicle-brands"],
  {
    revalidate: PUBLIC_VEHICLES_REVALIDATE_SECONDS,
    tags: [PUBLIC_VEHICLES_CACHE_TAG],
  }
);

export const getPublicVehicleCount = unstable_cache(
  async (filters?: VehicleFilterValues) => getVehicleCount(filters),
  ["public-vehicle-count"],
  {
    revalidate: PUBLIC_VEHICLES_REVALIDATE_SECONDS,
    tags: [PUBLIC_VEHICLES_CACHE_TAG],
  }
);
