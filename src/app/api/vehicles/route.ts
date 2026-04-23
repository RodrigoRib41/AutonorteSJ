import {
  parseVehicleFilters,
  type VehicleFilterValues,
  type VehicleSearchParams,
} from "@/lib/vehicle-filters";
import {
  NO_STORE_HEADERS,
  PUBLIC_CATALOG_CACHE_HEADERS,
} from "@/lib/cache-headers";
import {
  getPublicPaginatedVehicles,
  getPublicVehicleCount,
} from "@/lib/public-vehicle-queries";
import {
  serializeVehicle,
  VEHICLE_CATALOG_PAGE_SIZE,
  type VehicleCatalogPageResponse,
} from "@/lib/vehicle-records";

export const runtime = "nodejs";

const MAX_VEHICLE_CATALOG_PAGE_SIZE = 24;

function getIntegerParam(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSearchParamsRecord(searchParams: URLSearchParams) {
  return Array.from(searchParams.entries()).reduce<VehicleSearchParams>(
    (record, [key, value]) => {
      record[key] = value;
      return record;
    },
    {}
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters: VehicleFilterValues = {
    ...parseVehicleFilters(getSearchParamsRecord(url.searchParams)),
    destacado: "",
    hasImages: "",
  };
  const offset = Math.max(0, getIntegerParam(url.searchParams.get("offset"), 0));
  const requestedLimit = getIntegerParam(
    url.searchParams.get("limit"),
    VEHICLE_CATALOG_PAGE_SIZE
  );
  const limit = Math.min(
    Math.max(1, requestedLimit),
    MAX_VEHICLE_CATALOG_PAGE_SIZE
  );

  try {
    const [vehicles, totalCount] = await Promise.all([
      getPublicPaginatedVehicles(filters, {
        skip: offset,
        take: limit,
      }),
      getPublicVehicleCount(filters),
    ]);
    const nextOffset = offset + vehicles.length;

    return Response.json(
      {
        success: true,
        vehicles: vehicles.map(serializeVehicle),
        totalCount,
        nextOffset,
        hasMore: nextOffset < totalCount,
      } satisfies VehicleCatalogPageResponse,
      { headers: PUBLIC_CATALOG_CACHE_HEADERS, status: 200 }
    );
  } catch (error) {
    console.error("Error loading vehicle catalog page", error);

    return Response.json(
      {
        success: false,
        message: "No pudimos cargar mas vehiculos en este momento.",
      } satisfies VehicleCatalogPageResponse,
      { headers: NO_STORE_HEADERS, status: 500 }
    );
  }
}
