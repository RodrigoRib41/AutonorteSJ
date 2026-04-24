import {
  getVehicleDisplayPrice,
  hasVehiclePromotion,
  vehicleCategories,
  vehicleConditions,
  vehicleCurrencies,
  type VehicleCategory,
  type VehicleCondition,
  type VehicleCurrency,
  type VehiclePreview,
} from "@/lib/vehicle-records";

export type VehicleSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type VehicleSortOption =
  | "updated-desc"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "kilometraje-asc";

export type VehicleBooleanFilter = "" | "true" | "false";

export type VehicleFilterValues = {
  q: string;
  marca: string;
  condition: VehicleCondition | "";
  category: VehicleCategory | "";
  currency: VehicleCurrency | "";
  anioMin: string;
  anioMax: string;
  kilometrajeMin: string;
  kilometrajeMax: string;
  destacado: VehicleBooleanFilter;
  hasImages: VehicleBooleanFilter;
  hasPromotion: VehicleBooleanFilter;
  sort: VehicleSortOption;
};

export const defaultVehicleSort: VehicleSortOption = "updated-desc";

export const vehicleSortOptions: Array<{
  label: string;
  value: VehicleSortOption;
}> = [
  { value: "updated-desc", label: "Mas recientes" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "year-desc", label: "Ano: mas nuevos primero" },
  { value: "kilometraje-asc", label: "Kilometraje: menor a mayor" },
];

export const emptyVehicleFilters: VehicleFilterValues = {
  q: "",
  marca: "",
  condition: "",
  category: "",
  currency: "",
  anioMin: "",
  anioMax: "",
  kilometrajeMin: "",
  kilometrajeMax: "",
  destacado: "",
  hasImages: "",
  hasPromotion: "",
  sort: defaultVehicleSort,
};

function getFirstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeTextValue(value: string | string[] | undefined) {
  return getFirstParamValue(value).trim();
}

function normalizeDigits(value: string | string[] | undefined) {
  return getFirstParamValue(value).replace(/[^\d]/g, "");
}

function normalizeCurrency(
  value: string | string[] | undefined
): VehicleCurrency | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleCurrencies.includes(normalized as VehicleCurrency)) {
    return normalized as VehicleCurrency;
  }

  return "";
}

function normalizeCondition(
  value: string | string[] | undefined
): VehicleCondition | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleConditions.includes(normalized as VehicleCondition)) {
    return normalized as VehicleCondition;
  }

  return "";
}

function normalizeCategory(
  value: string | string[] | undefined
): VehicleCategory | "" {
  const normalized = getFirstParamValue(value).trim().toUpperCase();

  if (vehicleCategories.includes(normalized as VehicleCategory)) {
    return normalized as VehicleCategory;
  }

  return "";
}

function normalizeBooleanFilter(
  value: string | string[] | undefined
): VehicleBooleanFilter {
  const normalized = getFirstParamValue(value).trim().toLowerCase();

  if (normalized === "true" || normalized === "false") {
    return normalized;
  }

  return "";
}

function normalizeSort(value: string | string[] | undefined): VehicleSortOption {
  const normalized = getFirstParamValue(value).trim() as VehicleSortOption;

  if (vehicleSortOptions.some((option) => option.value === normalized)) {
    return normalized;
  }

  return defaultVehicleSort;
}

export function parseVehicleFilters(
  searchParams?: VehicleSearchParams
): VehicleFilterValues {
  if (!searchParams) {
    return emptyVehicleFilters;
  }

  return {
    q: normalizeTextValue(searchParams.q),
    marca: normalizeTextValue(searchParams.marca),
    condition: normalizeCondition(searchParams.condition),
    category: normalizeCategory(searchParams.category),
    currency: normalizeCurrency(searchParams.currency),
    anioMin: normalizeDigits(searchParams.anioMin),
    anioMax: normalizeDigits(searchParams.anioMax),
    kilometrajeMin: normalizeDigits(searchParams.kilometrajeMin),
    kilometrajeMax: normalizeDigits(searchParams.kilometrajeMax),
    destacado: normalizeBooleanFilter(searchParams.destacado),
    hasImages: normalizeBooleanFilter(searchParams.hasImages),
    hasPromotion: normalizeBooleanFilter(searchParams.hasPromotion),
    sort: normalizeSort(searchParams.sort),
  };
}

export function countActiveVehicleFilters(
  filters: VehicleFilterValues,
  options?: { includeAdminFields?: boolean }
) {
  let count = 0;

  if (filters.q) count += 1;
  if (filters.marca) count += 1;
  if (filters.condition) count += 1;
  if (filters.category) count += 1;
  if (filters.currency) count += 1;
  if (filters.anioMin) count += 1;
  if (filters.anioMax) count += 1;
  if (filters.kilometrajeMin) count += 1;
  if (filters.kilometrajeMax) count += 1;
  if (filters.hasPromotion) count += 1;
  if (filters.sort !== defaultVehicleSort) count += 1;

  if (options?.includeAdminFields) {
    if (filters.destacado) count += 1;
    if (filters.hasImages) count += 1;
  }

  return count;
}

export function hasActiveVehicleFilters(
  filters: VehicleFilterValues,
  options?: { includeAdminFields?: boolean }
) {
  return countActiveVehicleFilters(filters, options) > 0;
}

export type VehicleFilterableRecord = Pick<
  VehiclePreview,
  | "marca"
  | "modelo"
  | "condition"
  | "category"
  | "anio"
  | "kilometraje"
  | "precio"
  | "promotionalPrice"
  | "currency"
  | "descripcion"
  | "destacado"
  | "images"
> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function toTimestamp(value: string | Date | undefined) {
  if (!value) {
    return 0;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function matchesBooleanFilter(
  filter: VehicleBooleanFilter,
  value: boolean
) {
  if (!filter) {
    return true;
  }

  return filter === "true" ? value : !value;
}

export function matchesVehicleFilters(
  vehicle: VehicleFilterableRecord,
  filters: VehicleFilterValues,
  options?: { includeAdminFields?: boolean }
) {
  const normalizedQuery = filters.q.trim().toLowerCase();

  if (normalizedQuery) {
    const searchValue = [
      vehicle.marca,
      vehicle.modelo,
      String(vehicle.anio),
      vehicle.descripcion ?? "",
    ]
      .join(" ")
      .toLowerCase();

    if (!searchValue.includes(normalizedQuery)) {
      return false;
    }
  }

  if (
    filters.marca &&
    vehicle.marca.trim().toLowerCase() !== filters.marca.trim().toLowerCase()
  ) {
    return false;
  }

  if (filters.condition && vehicle.condition !== filters.condition) {
    return false;
  }

  if (filters.category && vehicle.category !== filters.category) {
    return false;
  }

  if (filters.currency && vehicle.currency !== filters.currency) {
    return false;
  }

  if (filters.anioMin && vehicle.anio < Number(filters.anioMin)) {
    return false;
  }

  if (filters.anioMax && vehicle.anio > Number(filters.anioMax)) {
    return false;
  }

  if (
    filters.kilometrajeMin &&
    vehicle.kilometraje < Number(filters.kilometrajeMin)
  ) {
    return false;
  }

  if (
    filters.kilometrajeMax &&
    vehicle.kilometraje > Number(filters.kilometrajeMax)
  ) {
    return false;
  }

  if (
    !matchesBooleanFilter(filters.hasPromotion, hasVehiclePromotion(vehicle))
  ) {
    return false;
  }

  if (options?.includeAdminFields) {
    if (!matchesBooleanFilter(filters.destacado, vehicle.destacado)) {
      return false;
    }

    if (
      !matchesBooleanFilter(filters.hasImages, vehicle.images.length > 0)
    ) {
      return false;
    }
  }

  return true;
}

export function sortVehicleRecords<T extends VehicleFilterableRecord>(
  vehicles: T[],
  sort: VehicleSortOption = defaultVehicleSort
) {
  return [...vehicles].sort((left, right) => {
    switch (sort) {
      case "price-asc":
        return (
          getVehicleDisplayPrice(left) - getVehicleDisplayPrice(right) ||
          right.anio - left.anio
        );
      case "price-desc":
        return (
          getVehicleDisplayPrice(right) - getVehicleDisplayPrice(left) ||
          right.anio - left.anio
        );
      case "year-desc":
        return right.anio - left.anio || right.kilometraje - left.kilometraje;
      case "kilometraje-asc":
        return (
          left.kilometraje - right.kilometraje ||
          right.anio - left.anio
        );
      case "updated-desc":
      default:
        return (
          toTimestamp(right.updatedAt ?? right.createdAt) -
            toTimestamp(left.updatedAt ?? left.createdAt) ||
          right.anio - left.anio
        );
    }
  });
}
